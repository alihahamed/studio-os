export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-surface-50">Settings</h1>
        <p className="mt-1 text-sm text-surface-400">
          Manage your agency configuration.
        </p>
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <h3 className="mb-4 text-sm font-medium text-surface-200">
          Agency Branding
        </h3>
        <p className="text-sm text-surface-500">
          Branding customization will be available in a future update.
        </p>
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <h3 className="mb-4 text-sm font-medium text-surface-200">
          Payment Configuration
        </h3>
        <p className="text-sm text-surface-500">
          DodoPayments is configured via environment variables. Manage your
          products in the DodoPayments Dashboard.
        </p>
      </div>
    </div>
  );
}
