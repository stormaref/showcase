"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { AdminBrand } from "@/lib/api";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [error, setError] = useState("");

  function load() {
    adminFetch<{ items: AdminBrand[] }>("/api/v1/admin/brands").then((d) =>
      setBrands(d.items),
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this brand?")) return;
    setError("");
    try {
      await adminFetch(`/api/v1/admin/brands/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          <p className="mt-1 text-sm text-gray-500">
            The brands owned by the company, shown on the public site and
            selectable on each design.
          </p>
        </div>
        <Link
          href="/admin/brands/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add brand
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">Persian</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-b border-gray-50">
                <td className="px-4 py-3">
                  {b.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.logo_url}
                      alt=""
                      className="size-10 rounded border border-gray-100 object-contain p-0.5"
                    />
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {b.translations?.en?.name ?? b.name}
                </td>
                <td className="px-4 py-3 text-gray-500" dir="rtl">
                  {b.translations?.fa?.name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {b.website_url ? (
                    <a
                      href={b.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Link
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{b.sort_order ?? 0}</td>
                <td className="px-4 py-3">
                  {b.is_published ? (
                    <span className="text-xs text-green-700">Published</span>
                  ) : (
                    <span className="text-xs text-gray-400">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <Link
                    href={`/admin/brands/${b.id}`}
                    className="me-3 text-xs text-gray-700 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No brands yet. Add your first brand above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
