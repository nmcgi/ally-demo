/**
 * Seeds local demo data.
 *
 *   pnpm db:seed          (from the repo root, or `pnpm db:seed` inside apps/api)
 *
 * Idempotent — safe to re-run. It:
 *   1. creates (or repairs) the starter users — one per role
 *   2. gives every user without accounts a checking + savings pair
 *   3. backfills sample transactions on each new checking account
 *
 * Registration only creates a user row, so a freshly registered account has an
 * empty dashboard until this runs. Re-run it any time you add a new user — it
 * only touches users that are missing accounts.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { UserEntity } from '../users/entities/user.entity';
import { AccountEntity } from '../accounts/entities/account.entity';
import { TransactionEntity } from '../accounts/entities/transaction.entity';
import { AccountType, TransactionType, UserRole } from '@ally/shared-types';

/** Shared by every seeded login — local demo only. */
const SEED_PASSWORD = 'AllyFinancial123!';

/**
 * One starter user per role, so every part of the UI can be demoed without
 * hand-editing roles in Postgres. Re-running resets these passwords and roles,
 * which is what makes a half-configured login recoverable.
 */
const SEED_USERS: ReadonlyArray<{
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}> = [
  { email: 'admin@ally.com', firstName: 'Ally', lastName: 'Admin', role: 'admin' },
  { email: 'support@ally.com', firstName: 'Sam', lastName: 'Support', role: 'support' },
  { email: 'demo@ally.com', firstName: 'Demo', lastName: 'Customer', role: 'customer' },
];

/** Opening balances for the pair of accounts every user gets. */
const STARTER_ACCOUNTS: ReadonlyArray<{
  type: AccountType;
  nickname: string;
  balance: number;
}> = [
  { type: 'checking', nickname: 'Everyday Checking', balance: 4820.55 },
  { type: 'savings', nickname: 'Online Savings', balance: 15250.0 },
];

/**
 * Applied newest-first to a checking account. `delta` is signed for the running
 * balance only — rows are stored with a positive `amount`, matching the rest of
 * the app (direction comes from `type`, and the UI prepends its own +/-).
 */
const SAMPLE_TRANSACTIONS: ReadonlyArray<{
  type: TransactionType;
  delta: number;
  description: string;
  merchantName?: string;
  category?: string;
  daysAgo: number;
}> = [
  { type: 'debit', delta: -84.32, description: 'Card purchase', merchantName: 'Whole Foods', category: 'Groceries', daysAgo: 1 },
  { type: 'debit', delta: -12.99, description: 'Subscription', merchantName: 'Netflix', category: 'Entertainment', daysAgo: 3 },
  { type: 'credit', delta: 2400.0, description: 'Direct deposit — payroll', merchantName: 'Acme Corp', category: 'Income', daysAgo: 5 },
  { type: 'debit', delta: -156.4, description: 'Card purchase', merchantName: 'Delta Air Lines', category: 'Travel', daysAgo: 9 },
  { type: 'debit', delta: -62.18, description: 'Utility payment', merchantName: 'City Power & Light', category: 'Utilities', daysAgo: 14 },
  { type: 'interest', delta: 3.27, description: 'Interest paid', category: 'Interest', daysAgo: 21 },
];

function accountNumber(): string {
  return String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
}

/** Reserves an account number not already present in `taken`. */
function uniqueAccountNumber(taken: Set<string>): string {
  let candidate = accountNumber();
  while (taken.has(candidate)) candidate = accountNumber();
  taken.add(candidate);
  return candidate;
}

async function upsertSeedUsers(users: Repository<UserEntity>): Promise<void> {
  // One hash for all seed users — bcrypt at cost 12 is deliberately slow.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  for (const spec of SEED_USERS) {
    const existing = await users.findOne({ where: { email: spec.email } });

    if (existing) {
      // Reset password and role so a half-configured login is repaired.
      existing.passwordHash = passwordHash;
      existing.role = spec.role;
      await users.save(existing);
    } else {
      await users.save(
        users.create({
          email: spec.email,
          passwordHash,
          firstName: spec.firstName,
          lastName: spec.lastName,
          role: spec.role,
        }),
      );
    }

    console.log(
      `  ${spec.role.padEnd(8)} ${spec.email.padEnd(20)} ${existing ? '(updated)' : '(created)'}`,
    );
  }
}

/** Builds transactions ending at the account's current balance. */
function buildTransactions(account: AccountEntity): Partial<TransactionEntity>[] {
  // Walk backwards from the current balance so the newest row matches it.
  let running = Number(account.balance);

  return SAMPLE_TRANSACTIONS.map((tx) => {
    const postedAt = new Date(Date.now() - tx.daysAgo * 24 * 60 * 60 * 1000);
    const balanceAfter = running;
    running = Number((running - tx.delta).toFixed(2));

    return {
      accountId: account.id,
      type: tx.type,
      status: 'posted' as const,
      amount: Math.abs(tx.delta),
      balance: balanceAfter,
      description: tx.description,
      ...(tx.merchantName !== undefined && { merchantName: tx.merchantName }),
      ...(tx.category !== undefined && { category: tx.category }),
      postedAt,
    };
  });
}

async function seedAccountsFor(
  user: UserEntity,
  accounts: Repository<AccountEntity>,
  transactions: Repository<TransactionEntity>,
  taken: Set<string>,
): Promise<boolean> {
  const existing = await accounts.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log(`  skip   ${user.email} (${existing} account(s) already)`);
    return false;
  }

  const created = await accounts.save(
    STARTER_ACCOUNTS.map((spec) =>
      accounts.create({
        userId: user.id,
        accountNumber: uniqueAccountNumber(taken),
        type: spec.type,
        balance: spec.balance,
        availableBalance: spec.balance,
        currency: 'USD',
        nickname: spec.nickname,
        isActive: true,
      }),
    ),
  );

  const checking = created.find((a) => a.type === 'checking');
  if (checking) {
    await transactions.save(transactions.create(buildTransactions(checking)));
  }

  console.log(
    `  seed   ${user.email} → ${created.map((a) => `${a.type} ****${a.accountNumber.slice(-4)}`).join(', ')}`,
  );
  return true;
}

async function main(): Promise<void> {
  // Keep the output readable — TypeORM logs every query in development.
  process.env['DB_LOGGING'] ??= 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const users = dataSource.getRepository(UserEntity);
    const accounts = dataSource.getRepository(AccountEntity);
    const transactions = dataSource.getRepository(TransactionEntity);

    console.log('\nSeeding demo data…\n');

    await upsertSeedUsers(users);
    console.log('');

    const allUsers = await users.find({ order: { createdAt: 'ASC' } });
    const taken = new Set(
      (await accounts.find({ select: { accountNumber: true } })).map((a) => a.accountNumber),
    );

    let seeded = 0;
    for (const user of allUsers) {
      if (await seedAccountsFor(user, accounts, transactions, taken)) seeded += 1;
    }

    console.log(
      `\nDone — ${allUsers.length} user(s) checked, ${seeded} newly seeded.` +
        `\nStarter logins (password: ${SEED_PASSWORD}):\n` +
        SEED_USERS.map((u) => `  ${u.email.padEnd(20)} ${u.role}`).join('\n') +
        '\n',
    );
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
