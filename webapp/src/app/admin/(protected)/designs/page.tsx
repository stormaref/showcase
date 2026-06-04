"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { Design } from "@/lib/api";

export default function AdminDesignsPage() {
  const [items, setItems] = useState<Design[]>([]);

  function load() {
    adminFetch<{ items: Design[] }>("/api/v1/admin/designs").then((d) =>
      setItems(d.items),
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this design?")) return;
    await adminFetch(`/api/v1/admin/designs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Designs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tile designs, images, and available sizes.
          </p>
        </div>
        <Link
          href="/admin/designs/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          New design
        </Link>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.primary_thumb_url || item.primary_image_url}
              alt={item.alt_text || item.title}
              className="aspect-video w-full object-cover"
            />
            <div className="p-4">
              <p className="text-sm font-medium">
                {item.title}
                {item.has_fa && (
                  <span className="ms-2 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-normal text-indigo-700">
                    FA
                  </span>
                )}
                {!item.is_published && (
                  <span className="ms-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-600">
                    Draft
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {item.sizes.length} size{item.sizes.length !== 1 ? "s" : ""} ·{" "}
                {(item.image_count ?? item.images?.length ?? 0)} image
                {(item.image_count ?? item.images?.length ?? 0) !== 1 ? "s" : ""}
              </p>
              <div className="mt-3 flex gap-3">
                <Link
                  href={`/admin/designs/${item.id}`}
                  className="text-xs font-medium text-gray-700 hover:underline"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-xs text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
