// Type declarations for Module Federation remotes.
// Each remote exposes these components via its remoteEntry.js bundle.

declare module 'accounts/AccountsDashboard' {
  const AccountsDashboard: React.ComponentType;
  export default AccountsDashboard;
}

declare module 'loans/LoanApplication' {
  const LoanApplication: React.ComponentType;
  export default LoanApplication;
}

declare module 'loans/LoanStatus' {
  interface LoanStatusProps {
    loanApplicationId: string;
  }
  const LoanStatus: React.ComponentType<LoanStatusProps>;
  export default LoanStatus;
}

declare module 'admin/AdminPortal' {
  interface AdminPortalProps {
    /** Role from the host Redux shell — only 'admin' may take review actions */
    role?: string | undefined;
  }
  const AdminPortal: React.ComponentType<AdminPortalProps>;
  export default AdminPortal;
}
