"use client";

import { Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { UploadProgressBar } from "@/components/admin/upload-progress-bar";
import { useUploadProgress } from "@/components/admin/upload-progress-context";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import type {
  AdminBrand,
  AdminDesignType,
  AdminSurfaceFinish,
  Design,
  DesignTranslation,
  TileSize,
} from "@/lib/api";
import {
  type LocaleTab,
  designTranslationsFromRecord,
} from "@/lib/translations";

export type PendingImage = {
  object_key: string;
  thumb_object_key: string;
  size_id: string | null;
  type_id: string | null;
  sort_order: number;
  preview_url: string;
  thumb_url: string;
};

type DesignFormProps = {
  sizes: TileSize[];
  types: AdminDesignType[];
  finishes: AdminSurfaceFinish[];
  brands: AdminBrand[];
  initial?: Design;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
};

const checkboxClass =
  "size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900";

function typeLabel(t: AdminDesignType): string {
  return t.translations?.en?.name ?? t.name;
}

function finishLabel(f: AdminSurfaceFinish): string {
  return f.translations?.en?.name ?? f.name;
}

function brandLabel(b: AdminBrand): string {
  return b.translations?.en?.name ?? b.name;
}

function variantKey(typeId: string, sizeId: string): string {
  return `${typeId}:${sizeId}`;
}

function imagesFromDesign(design?: Design): PendingImage[] {
  if (!design) return [];
  return design.images.map((img) => ({
    object_key: img.object_key || "",
    thumb_object_key: img.thumb_object_key || "",
    size_id: img.size_id ?? null,
    type_id: img.type_id ?? null,
    sort_order: img.sort_order,
    preview_url: img.image_url || "",
    thumb_url: img.thumb_url || img.image_url || "",
  }));
}

function variantKeysFromDesign(design?: Design): Set<string> {
  if (!design) return new Set();
  if (design.variants) {
    return new Set(design.variants.map((v) => variantKey(v.type_id, v.size_id)));
  }
  // Legacy responses without an explicit variant list imply the cartesian
  // product of the design's categories and sizes.
  const keys = new Set<string>();
  for (const tp of design.types ?? []) {
    for (const size of design.sizes) {
      keys.add(variantKey(tp.id, size.id));
    }
  }
  return keys;
}

function selectedFinishIdsFromDesign(design?: Design): string[] {
  if (!design) return [];
  return (design.finishes ?? []).map((f) => f.id);
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
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload className="size-4" aria-hidden />
        {label}
      </button>
    </div>
  );
}

export function DesignForm({
  sizes,
  types,
  finishes,
  brands,
  initial,
  onSubmit,
  submitLabel,
}: DesignFormProps) {
  const [tab, setTab] = useState<LocaleTab>("en");
  const [translations, setTranslations] = useState(() =>
    designTranslationsFromRecord(initial?.translations),
  );
  const [variantKeys, setVariantKeys] = useState<Set<string>>(() =>
    variantKeysFromDesign(initial),
  );
  const [selectedFinishIds, setSelectedFinishIds] = useState<string[]>(() =>
    selectedFinishIdsFromDesign(initial),
  );
  const [images, setImages] = useState<PendingImage[]>(() => imagesFromDesign(initial));
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [brandId, setBrandId] = useState<string>(initial?.brand_id ?? "");
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

  function toggleVariant(typeId: string, sizeId: string) {
    const key = variantKey(typeId, sizeId);
    setVariantKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setImages((imgs) =>
          imgs.filter((img) => !(img.type_id === typeId && img.size_id === sizeId)),
        );
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleFinish(id: string) {
    setSelectedFinishIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  async function handleUpload(
    files: FileList | null,
    sizeId: string | null,
    typeId: string | null,
  ) {
    if (!files?.length) return;
    setUploadError("");
    const existing = images.filter(
      (img) => img.size_id === sizeId && img.type_id === typeId,
    ).length;
    for (let i = 0; i < files.length; i++) {
      try {
        const data = await uploadImage(files[i]);
        setImages((prev) => [
          ...prev,
          {
            object_key: data.object_key,
            thumb_object_key: data.thumb_object_key,
            size_id: sizeId,
            type_id: typeId,
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
      brand_id: brandId || null,
      finish_ids: selectedFinishIds,
      variants: [...variantKeys].map((key) => {
        const [type_id, size_id] = key.split(":");
        return { type_id, size_id };
      }),
      translations: { en: translations.en },
      images: images.map((img) => ({
        object_key: img.object_key,
        thumb_object_key: img.thumb_object_key,
        size_id: img.size_id,
        type_id: img.type_id,
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
  const showcaseImages = images.filter((img) => !img.size_id && !img.type_id);

  const variantSections = types.flatMap((tp) =>
    sizes
      .filter((size) => variantKeys.has(variantKey(tp.id, size.id)))
      .map((size) => ({ type: tp, size })),
  );

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
              className="absolute end-1 top-1 cursor-pointer rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  }

  const showcaseIndices = images
    .map((img, i) => (!img.size_id && !img.type_id ? i : -1))
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

      <label className="block text-sm font-medium">
        Brand
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">No brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {brandLabel(b)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Variants</legend>
        <p className="text-xs text-gray-500">
          Tick the category and size combinations this product is offered in.
          Only ticked combinations appear on the public site.
        </p>
        {types.length === 0 || sizes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            {types.length === 0
              ? "No categories defined yet. Add tile categories first."
              : "No sizes defined yet. Add tile sizes first."}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pe-4 text-start font-medium text-gray-500">
                    Size
                  </th>
                  {types.map((tp) => (
                    <th
                      key={tp.id}
                      className="px-3 py-2 text-center font-medium text-gray-700"
                    >
                      {typeLabel(tp)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => (
                  <tr key={size.id} className="border-b border-gray-100 last:border-0">
                    <th
                      scope="row"
                      className="py-2 pe-4 text-start font-normal text-gray-900"
                    >
                      {size.label}
                    </th>
                    {types.map((tp) => (
                      <td key={tp.id} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${typeLabel(tp)} — ${size.label}`}
                          checked={variantKeys.has(variantKey(tp.id, size.id))}
                          onChange={() => toggleVariant(tp.id, size.id)}
                          className={checkboxClass}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Surface finishes</legend>
        {finishes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No finishes defined yet. Add surface finishes first.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {finishes.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedFinishIds.includes(f.id)}
                  onChange={() => toggleFinish(f.id)}
                  className={checkboxClass}
                />
                {finishLabel(f)}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Showcase images</legend>
        <p className="text-xs text-gray-500">
          Room shots and marketing photos not tied to a specific size or type.
        </p>
        <FileUploadButton
          disabled={isUploading}
          onChange={(e) => {
            handleUpload(e.target.files, null, null);
            e.target.value = "";
          }}
        />
        {renderImageGrid(showcaseImages, showcaseIndices)}
      </fieldset>

      {variantSections.map(({ type: tp, size }) => {
        const comboImages = images.filter(
          (img) => img.size_id === size.id && img.type_id === tp.id,
        );
        const comboIndices = images
          .map((img, i) =>
            img.size_id === size.id && img.type_id === tp.id ? i : -1,
          )
          .filter((i) => i >= 0);
        return (
          <fieldset
            key={`${tp.id}-${size.id}`}
            className="rounded-xl border border-gray-200 p-4"
          >
            <legend className="px-1 text-sm font-medium">
              {typeLabel(tp)} — {size.label}
            </legend>
            <FileUploadButton
              disabled={isUploading}
              onChange={(e) => {
                handleUpload(e.target.files, size.id, tp.id);
                e.target.value = "";
              }}
            />
            {renderImageGrid(comboImages, comboIndices)}
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
        className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
