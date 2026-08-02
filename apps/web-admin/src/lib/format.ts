export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export function formatLoanType(t: string): string {
  const map: Record<string, string> = {
    personal: 'Personal', auto: 'Auto', home_equity: 'Home equity', mortgage: 'Mortgage',
  };
  return map[t] ?? t;
}

export function formatLoanStatus(s: string): string {
  const map: Record<string, string> = {
    submitted: 'Submitted',
    kyc_pending: 'KYC pending',
    kyc_approved: 'KYC approved',
    kyc_failed: 'KYC failed',
    credit_check_pending: 'Credit check',
    credit_check_approved: 'Credit approved',
    credit_check_failed: 'Credit failed',
    underwriting: 'Underwriting',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
    closed: 'Closed',
    draft: 'Draft',
  };
  return map[s] ?? s;
}

export function formatRole(r: string): string {
  const map: Record<string, string> = { admin: 'Admin', support: 'Support', customer: 'Customer' };
  return map[r] ?? r;
}
