import { company } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-gray-500">
        <p>
          {company.address.lines[0]}, {company.address.lines[2]} ·{" "}
          <a href={`tel:${company.phoneTel}`} className="hover:text-gray-900">
            {company.phone}
          </a>
        </p>
        <p className="mt-3">
          © {new Date().getFullYear()} {company.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
