import { CompanyInfoForm } from "@/components/admin/company-info-form";

export default function AdminCompanyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Company info</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage the company name, about text, and contact details shown across the
        public site. English is required; Persian is optional.
      </p>
      <CompanyInfoForm />
    </div>
  );
}
