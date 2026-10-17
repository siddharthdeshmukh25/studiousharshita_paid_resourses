import AdminLayout from '@/components/admin/AdminLayout';
import ReferralSettings from '@/components/admin/ReferralSettings';

export default function AdminReferralsPage() {
  return (
    <AdminLayout>
      <div className="space-y-5 font-poppins">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Growth</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-.045em]">Refer &amp; Earn</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage referral commissions and see how students are sharing resources.</p>
        </header>
        <ReferralSettings />
      </div>
    </AdminLayout>
  );
}
