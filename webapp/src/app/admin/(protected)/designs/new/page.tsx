"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DesignForm } from "@/components/admin/design-form";
import { adminFetch } from "@/lib/admin-api";
import type { AdminDesignType, TileSize } from "@/lib/api";

export default function NewDesignPage() {
  const router = useRouter();
  const [sizes, setSizes] = useState<TileSize[]>([]);
  const [types, setTypes] = useState<AdminDesignType[]>([]);

  useEffect(() => {
    Promise.all([
      adminFetch<{ items: TileSize[] }>("/api/v1/admin/sizes"),
      adminFetch<{ items: AdminDesignType[] }>("/api/v1/admin/types"),
    ]).then(([s, t]) => {
      setSizes(s.items);
      setTypes(t.items);
    });
  }, []);

  async function handleSubmit(payload: Record<string, unknown>) {
    await adminFetch("/api/v1/admin/designs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    router.push("/admin/designs");
  }

  return (
    <div>
      <Link href="/admin/designs" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to designs
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New design</h1>
      <div className="mt-8">
        <DesignForm sizes={sizes} types={types} onSubmit={handleSubmit} submitLabel="Create design" />
      </div>
    </div>
  );
}
