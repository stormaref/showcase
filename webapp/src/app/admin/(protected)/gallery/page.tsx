"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { UploadProgressBar } from "@/components/admin/upload-progress-bar";
import { useUploadProgress } from "@/components/admin/upload-progress-context";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import { adminFetch } from "@/lib/admin-api";
import type { GalleryItem, GalleryTranslation } from "@/lib/api";
import {
  type LocaleTab,
  galleryTranslationsFromRecord,
} from "@/lib/translations";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [tab, setTab] = useState<LocaleTab>("en");
  const [translations, setTranslations] = useState(
    galleryTranslationsFromRecord(),
  );
  const [uploadError, setUploadError] = useState("");
  const [keys, setKeys] = useState({ object: "", thumb: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, percent } = useUploadProgress();

  function load() {
    adminFetch<{ items: GalleryItem[] }>("/api/v1/admin/gallery").then((d) =>
      setItems(d.items),
    );
  }

  useEffect(() => {
    load();
  }, []);

  function updateTranslation(locale: LocaleTab, patch: Partial<GalleryTranslation>) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], ...patch },
    }));
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    try {
      const data = await uploadImage(file);
      setKeys({ object: data.object_key, thumb: data.thumb_object_key });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setKeys({ object: "", thumb: "" });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!keys.object || !translations.en.title) return;
    const payload: Record<string, unknown> = {
      object_key: keys.object,
      thumb_object_key: keys.thumb,
      is_published: true,
      translations: {
        en: translations.en,
      },
    };
    if (translations.fa.title) {
      (payload.translations as Record<string, GalleryTranslation>).fa =
        translations.fa;
    }
    await adminFetch("/api/v1/admin/gallery", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setTranslations(galleryTranslationsFromRecord());
    setKeys({ object: "", thumb: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await adminFetch(`/api/v1/admin/gallery/${id}`, { method: "DELETE" });
    load();
  }

  const t = translations[tab];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
      <p className="mt-1 text-sm text-gray-500">Upload images stored in MinIO.</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <TranslationTabs active={tab} onChange={setTab} />
        <label className="block text-sm font-medium">
          Image file
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            disabled={isUploading}
            className="mt-1 block w-full text-sm disabled:opacity-50"
          />
        </label>
        {isUploading && percent !== null && (
          <UploadProgressBar percent={percent} label="Uploading image…" />
        )}
        {uploadError && (
          <p className="text-sm text-red-600">{uploadError}</p>
        )}
        {keys.object && (
          <p className="text-xs text-green-700">Uploaded — ready to save metadata</p>
        )}
        <input
          placeholder="Title"
          required={tab === "en"}
          value={t.title}
          onChange={(e) => updateTranslation(tab, { title: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <input
          placeholder="Alt text"
          value={t.alt_text}
          onChange={(e) => updateTranslation(tab, { alt_text: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <textarea
          placeholder="Caption"
          value={t.caption}
          onChange={(e) => updateTranslation(tab, { caption: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <button
          type="submit"
          disabled={!keys.object || !translations.en.title}
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
              <p className="text-sm font-medium">
                {item.title}
                {item.has_fa && (
                  <span className="ms-2 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-normal text-indigo-700">
                    FA
                  </span>
                )}
              </p>
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
