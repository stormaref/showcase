"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { GalleryItem } from "@/lib/api";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [keys, setKeys] = useState({ object: "", thumb: "" });

  function load() {
    adminFetch<{ items: GalleryItem[] }>("/api/v1/admin/gallery").then((d) =>
      setItems(d.items),
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await (await import("@/lib/admin-api")).uploadFile(file);
      setKeys({ object: data.object_key, thumb: data.thumb_object_key });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!keys.object) return;
    await adminFetch("/api/v1/admin/gallery", {
      method: "POST",
      body: JSON.stringify({
        title,
        caption,
        alt_text: altText,
        object_key: keys.object,
        thumb_object_key: keys.thumb,
        is_published: true,
      }),
    });
    setTitle("");
    setCaption("");
    setAltText("");
    setKeys({ object: "", thumb: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await adminFetch(`/api/v1/admin/gallery/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
      <p className="mt-1 text-sm text-gray-500">Upload images stored in MinIO.</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <label className="block text-sm font-medium">
          Image file
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            className="mt-1 block w-full text-sm"
          />
        </label>
        {uploading && <p className="text-sm text-gray-500">Uploading…</p>}
        {keys.object && (
          <p className="text-xs text-green-700">Uploaded — ready to save metadata</p>
        )}
        <input
          placeholder="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Alt text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!keys.object || !title}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Add to gallery
        </button>
      </form>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumb_url || item.image_url}
              alt={item.alt_text}
              className="aspect-video w-full object-cover"
            />
            <div className="flex items-center justify-between p-4">
              <p className="text-sm font-medium">{item.title}</p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
