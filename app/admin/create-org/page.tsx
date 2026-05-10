import { CreateOrganization } from "@clerk/nextjs";

export default function CreateOrgPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-surface-50">
          Create Your Agency
        </h1>
        <p className="mt-2 text-sm text-surface-400">
          Set up your organization to start managing projects.
        </p>
      </div>
      <CreateOrganization
        afterCreateOrganizationUrl="/admin"
        appearance={{
          elements: {
            card: "bg-surface-900 border border-surface-800",
          },
        }}
      />
    </div>
  );
}
