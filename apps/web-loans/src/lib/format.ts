export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatLoanType(type: string): string {
  const labels: Record<string, string> = {
    auto: 'Auto Loan',
    personal: 'Personal Loan',
    home_equity: 'Home Equity Loan',
    mortgage: 'Mortgage',
  };
  return labels[type] ?? type;
}

export function formatEmploymentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export function estimateMonthlyPayment(amount: number, annualRatePct: number, termMonths: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}
