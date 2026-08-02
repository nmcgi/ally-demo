'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/accounts', label: 'Accounts', permission: 'accounts:read' },
  { href: '/loans', label: 'Loans', permission: 'loans:read' },
  { href: '/admin', label: 'Admin', permission: 'admin:users' },
];

export function Nav() {
  const pathname = usePathname();
  const permissions = useAppSelector((s) => s.entitlements.permissions);

  const visibleItems = NAV_ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex gap-1 -mb-px">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'inline-block px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    active
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
