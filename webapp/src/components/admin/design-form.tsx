"use client";

import { Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { UploadProgressBar } from "@/components/admin/upload-progress-bar";
import { useUploadProgress } from "@/components/admin/upload-progress-context";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import type { Design, DesignTranslation, TileSize } from "@/lib/api";
import {
  type LocaleTab,
  designTranslationsFromRecord,
} from "@/lib/translations";

export type PendingImage = {
  object_key: string;
  thumb_object_key: string;
  size_id: string | null;
  sort_order: number;
  preview_url: string;
  thumb_url: string;
};

type DesignFormProps = {
  sizes: TileSize[];
  initial?: Design;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
};

const checkboxClass =
  "size-4 shrink-0 rounded border-gray-300 accent-gray-900";

function imagesFromDesign(design?: Design): PendingImage[] {
  if (!design) return [];
  return design.images.map((img) => ({
    object_key: img.object_key || "",
    thumb_object_key: img.thumb_object_key || "",
    size_id: img.size_id ?? null,
    sort_order: img.sort_order,
    preview_url: img.image_url || "",
    thumb_url: img.thumb_url || img.image_url || "",
  }));
}

function selectedSizeIdsFromDesign(design?: Design): string[] {
  if (!design) return [];
  const fromSizes = design.sizes.map((s) => s.id);
  const fromImages = design.images
    .map((img) => img.size_id)
    .filter((id): id is string => Boolean(id));
  return [...new Set([...fromSizes, ...fromImages])];
}

function FileUploadButton({
  disabled,
  onChange,
  label = "Upload images",
}: {
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload className="size-4" aria-hidden />
        {label}
      </button>
    </div>
  );
}

export function DesignForm({ sizes, initial, onSubmit, submitLabel }: DesignFormProps) {
  const [tab, setTab] = useState<LocaleTab>("en");
  const [translations, setTranslations] = useState(() =>
    designTranslationsFromRecord(initial?.translations),
  );
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>(() =>
    selectedSizeIdsFromDesign(initial),
  );
  const [images, setImages] = useState<PendingImage[]>(() => imagesFromDesign(initial));
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { uploadImage, isUploading, percent } = useUploadProgress();

  function updateTranslation(locale: LocaleTab, patch: Partial<DesignTranslation>) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], ...patch },
    }));
  }

  function toggleSize(id: string) {
    setSelectedSizeIds((prev) => {
      if (prev.includes(id)) {
        setImages((imgs) => imgs.filter((img) => img.size_id !== id));
        return prev.filter((s) => s !== id);
      }
      return [...prev, id];
    });
  }

  async function handleUpload(files: FileList | null, sizeId: string | null) {
    if (!files?.length) return;
    setUploadError("");
    const existing = images.filter((img) => img.size_id === sizeId).length;
    for (let i = 0; i < files.length; i++) {
      try {
        const data = await uploadImage(files[i]);
        setImages((prev) => [
          ...prev,
          {
            object_key: data.object_key,
            thumb_object_key: data.thumb_object_key,
            size_id: sizeId,
            sort_order: existing + i,
            preview_url: data.url,
            thumb_url: data.thumb_url,
          },
        ]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
        break;
      }
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function buildPayload() {
    const payload: Record<string, unknown> = {
      sort_order: sortOrder,
      is_published: isPublished,
      size_ids: selectedSizeIds,
      translations: { en: translations.en },
      images: images.map((img) => ({
        object_key: img.object_key,
        thumb_object_key: img.thumb_object_key,
        size_id: img.size_id,
        sort_order: img.sort_order,
      })),
    };
    if (translations.fa.title) {
      (payload.translations as Record<string, DesignTranslation>).fa = translations.fa;
    }
    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!translations.en.title) {
      setFormError("English title is required.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await onSubmit(buildPayload());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const t = translations[tab];
  const showcaseImages = images.filter((img) => !img.size_id);
  const selectedSizes = sizes.filter((s) => selectedSizeIds.includes(s.id));

  function renderImageGrid(list: PendingImage[], globalIndices: number[]) {
    if (list.length === 0) return null;
    return (
      <div className="mt-3 grid grid-cols-3 gap-2">
        {list.map((img, i) => (
          <div key={`${img.object_key}-${i}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumb_url || img.preview_url}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(globalIndices[i])}
              className="absolute end-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  }

  const showcaseIndices = images
    .map((img, i) => (!img.size_id ? i : -1))
    .filter((i) => i >= 0);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <TranslationTabs active={tab} onChange={setTab} />
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

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          Sort order
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="block text-sm font-medium">
          Status
          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 font-normal hover:bg-gray-50">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className={checkboxClass}
            />
            Published
          </label>
        </div>
      </div>

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Available sizes</legend>
        {sizes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sizes defined yet. Add tile sizes first.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sizes.map((size) => (
              <label
                key={size.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSizeIds.includes(size.id)}
                  onChange={() => toggleSize(size.id)}
                  className={checkboxClass}
                />
                {size.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Showcase images</legend>
        <p className="text-xs text-gray-500">
          Room shots and marketing photos not tied to a specific size.
        </p>
        <FileUploadButton
          disabled={isUploading}
          onChange={(e) => {
            handleUpload(e.target.files, null);
            e.target.value = "";
          }}
        />
        {renderImageGrid(
          showcaseImages,
          showcaseIndices,
        )}
      </fieldset>

      {selectedSizes.map((size) => {
        const sizeImages = images.filter((img) => img.size_id === size.id);
        const sizeIndices = images
          .map((img, i) => (img.size_id === size.id ? i : -1))
          .filter((i) => i >= 0);
        return (
          <fieldset key={size.id} className="rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-sm font-medium">{size.label} images</legend>
            <FileUploadButton
              disabled={isUploading}
              onChange={(e) => {
                handleUpload(e.target.files, size.id);
                e.target.value = "";
              }}
            />
            {renderImageGrid(sizeImages, sizeIndices)}
          </fieldset>
        );
      })}

      {isUploading && percent !== null && (
        <UploadProgressBar percent={percent} label="Uploading image…" />
      )}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={saving || !translations.en.title}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
