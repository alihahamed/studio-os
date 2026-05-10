export default function WorkspacePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-surface-50">Workspace</h1>
      <p className="text-sm text-surface-400">Upload assets for your project.</p>
      <div className="rounded-xl border border-dashed border-surface-700 p-16 text-center">
        <p className="text-surface-400">Drag and drop files here</p>
        <p className="mt-2 text-xs text-surface-500">Asset vault coming soon in MVP polish phase.</p>
      </div>
    </div>
  );
}
