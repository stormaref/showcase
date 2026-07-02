"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandForm } from "@/components/admin/brand-form";
import { adminFetch } from "@/lib/admin-api";
import type { AdminBrand } from "@/lib/api";

export default function EditBrandPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brand, setBrand] = useState<AdminBrand | null>(null);

  useEffect(() => {
    adminFetch<AdminBrand>(`/api/v1/admin/brands/${id}`).then(setBrand);
  }, [id]);

  async function handleSubmit(payload: Record<string, unknown>) {
    await adminFetch(`/api/v1/admin/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    router.push("/admin/brands");
  }

  if (!brand) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div>
      <Link
        href="/admin/brands"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Back to brands
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit brand</h1>
      <BrandForm
        initial={brand}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
