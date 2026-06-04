import { BrandForm } from "@/components/admin/brand-form";

export default function AdminBrandPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Brand info</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage company name, about text, and contact details shown on the public site.
        English is required; Persian is optional.
      </p>
      <BrandForm />
    </div>
  );
}
