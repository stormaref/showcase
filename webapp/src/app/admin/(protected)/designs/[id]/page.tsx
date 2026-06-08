"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DesignForm } from "@/components/admin/design-form";
import { adminFetch } from "@/lib/admin-api";
import type { AdminDesignType, AdminSurfaceFinish, Design, TileSize } from "@/lib/api";

export default function EditDesignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [design, setDesign] = useState<Design | null>(null);
  const [sizes, setSizes] = useState<TileSize[]>([]);
  const [types, setTypes] = useState<AdminDesignType[]>([]);
  const [finishes, setFinishes] = useState<AdminSurfaceFinish[]>([]);

  useEffect(() => {
    Promise.all([
      adminFetch<Design>(`/api/v1/admin/designs/${id}`),
      adminFetch<{ items: TileSize[] }>("/api/v1/admin/sizes"),
      adminFetch<{ items: AdminDesignType[] }>("/api/v1/admin/types"),
      adminFetch<{ items: AdminSurfaceFinish[] }>("/api/v1/admin/finishes"),
    ]).then(([d, s, t, f]) => {
      setDesign(d);
      setSizes(s.items);
      setTypes(t.items);
      setFinishes(f.items);
    });
  }, [id]);

  async function handleSubmit(payload: Record<string, unknown>) {
    await adminFetch(`/api/v1/admin/designs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    router.push("/admin/designs");
  }

  if (!design) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <div>
      <Link href="/admin/designs" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to designs
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit design</h1>
      <div className="mt-8">
        <DesignForm
          sizes={sizes}
          types={types}
          finishes={finishes}
          initial={design}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
