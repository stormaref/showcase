"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandForm } from "@/components/admin/brand-form";
import { adminFetch } from "@/lib/admin-api";

export default function NewBrandPage() {
  const router = useRouter();

  async function handleSubmit(payload: Record<string, unknown>) {
    await adminFetch("/api/v1/admin/brands", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    router.push("/admin/brands");
  }

  return (
    <div>
      <Link
        href="/admin/brands"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Back to brands
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New brand</h1>
      <BrandForm onSubmit={handleSubmit} submitLabel="Create brand" />
    </div>
  );
}
