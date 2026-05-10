import { AssetVault } from "@/components/portal/asset-vault";

export default async function WorkspacePage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await props.params;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-surface-50">Workspace</h1>
        <p className="mt-2 text-sm text-surface-400">
          Share source assets and project files in one secure vault.
        </p>
      </div>
      <AssetVault projectId={projectId} />
    </div>
  );
}
