"use client";

import { Upload } from "lucide-react";
import { ChangeEvent, FormEvent, type ReactNode, useRef, useState } from "react";
import { UploadProgressBar } from "@/components/admin/upload-progress-bar";
import { useUploadProgress } from "@/components/admin/upload-progress-context";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import type {
  AdminBrand,
  AdminDesignType,
  AdminSurfaceFinish,
  Design,
  DesignImageKind,
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
  kind: DesignImageKind;
  sort_order: number;
  preview_url: string;
  thumb_url: string;
};

type SlotKind = Exclude<DesignImageKind, "">;

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
  "size-4 shrink-0 cursor-pointer rounded-none border-gray-300 accent-gray-900";

const smallButtonClass =
  "cursor-pointer rounded-none border border-gray-200 bg-shell px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50";

// Preview frames are drawn inside this box, keeping the slot's aspect ratio.
const PREVIEW_BOX_W = 200;
const PREVIEW_BOX_H = 160;

// Public decoration images are shown at 16:9 on desktop.
const DECOR_ASPECT = 16 / 9;

// Tolerated difference between a tile image's and its size's aspect ratio.
const ASPECT_TOLERANCE = 0.02;

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

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** "1:2 portrait" for a 300×600 mm size. */
function aspectLabel(size: TileSize): string {
  const d = gcd(size.width_mm, size.height_mm) || 1;
  const ratio = `${size.width_mm / d}:${size.height_mm / d}`;
  if (size.width_mm === size.height_mm) return `${ratio} square`;
  return `${ratio} ${size.width_mm > size.height_mm ? "landscape" : "portrait"}`;
}

function aspectWarning(size: TileSize, imageRatio: number): string | null {
  const expected = size.width_mm / size.height_mm;
  if (Math.abs(imageRatio / expected - 1) <= ASPECT_TOLERANCE) return null;
  if (Math.abs(imageRatio * expected - 1) <= ASPECT_TOLERANCE) {
    return "This image looks rotated. Turn it to match the size before uploading.";
  }
  return `This image is ${imageRatio.toFixed(2)}:1 but ${size.label} needs ${aspectLabel(size)}, so visitors see it cropped.`;
}

function imagesFromDesign(design?: Design): PendingImage[] {
  if (!design) return [];
  return design.images.map((img) => ({
    object_key: img.object_key || "",
    thumb_object_key: img.thumb_object_key || "",
    size_id: img.size_id ?? null,
    type_id: img.type_id ?? null,
    kind: img.kind ?? "",
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
  label,
}: {
  disabled?: boolean;
  onChange: (file: File) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onChange(file);
        }}
        className="sr-only"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex cursor-pointer items-center gap-2 rounded-none border border-gray-200 bg-shell px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload className="size-4" aria-hidden />
        {label}
      </button>
    </>
  );
}

function ImageSlot({
  title,
  hint,
  aspect,
  image,
  disabled,
  warningFor,
  onUpload,
  onRemove,
}: {
  title: string;
  hint: string;
  aspect: number;
  image?: PendingImage;
  disabled?: boolean;
  warningFor?: (imageRatio: number) => string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const [measured, setMeasured] = useState<{ src: string; ratio: number } | null>(null);
  const src = image ? image.thumb_url || image.preview_url : "";
  const ratio = measured?.src === src ? measured.ratio : null;
  const warning = ratio !== null && warningFor ? warningFor(ratio) : null;

  const frameW = Math.min(PREVIEW_BOX_W, PREVIEW_BOX_H * aspect);
  const frameH = frameW / aspect;

  return (
    <div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      <div
        className="mt-3 flex items-end"
        style={{ height: PREVIEW_BOX_H }}
      >
        <div
          className={
            src
              ? "overflow-hidden bg-gray-100"
              : "flex items-center justify-center border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
          }
          style={{ width: frameW, height: frameH }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalHeight > 0) {
                  setMeasured({ src, ratio: naturalWidth / naturalHeight });
                }
              }}
              className="size-full object-cover"
            />
          ) : (
            "No image"
          )}
        </div>
      </div>
      {warning && <p className="mt-2 text-xs text-amber-700">{warning}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FileUploadButton
          disabled={disabled}
          onChange={onUpload}
          label={image ? "Replace" : "Upload"}
        />
        {image && (
          <button type="button" onClick={onRemove} className={smallButtonClass}>
            Remove
          </button>
        )}
      </div>
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

  function inSlot(img: PendingImage, typeId: string, sizeId: string, kind: DesignImageKind) {
    return img.type_id === typeId && img.size_id === sizeId && img.kind === kind;
  }

  async function uploadToSlot(file: File, typeId: string, sizeId: string, kind: SlotKind) {
    setUploadError("");
    try {
      const data = await uploadImage(file);
      // The new upload replaces whatever filled the slot before.
      setImages((prev) => [
        ...prev.filter((img) => !inSlot(img, typeId, sizeId, kind)),
        {
          object_key: data.object_key,
          thumb_object_key: data.thumb_object_key,
          size_id: sizeId,
          type_id: typeId,
          kind,
          sort_order: 0,
          preview_url: data.url,
          thumb_url: data.thumb_url,
        },
      ]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function removeFromSlot(typeId: string, sizeId: string, kind: SlotKind) {
    setImages((prev) => prev.filter((img) => !inSlot(img, typeId, sizeId, kind)));
  }

  /** Moves an older image into a slot; the slot's previous image becomes an older image. */
  function assignOlderImage(objectKey: string, kind: SlotKind) {
    setImages((prev) => {
      const target = prev.find((img) => img.object_key === objectKey);
      if (!target?.type_id || !target.size_id) return prev;
      return prev.map((img) => {
        if (img.object_key === objectKey) return { ...img, kind };
        if (inSlot(img, target.type_id!, target.size_id!, kind)) return { ...img, kind: "" };
        return img;
      });
    });
  }

  function removeImage(objectKey: string) {
    setImages((prev) => prev.filter((img) => img.object_key !== objectKey));
  }

  function isProductsPageImage(img: PendingImage) {
    return !img.size_id && !img.type_id;
  }

  // Images not tied to a size are products page images; the first one is used.
  async function uploadProductsPageImage(file: File) {
    setUploadError("");
    try {
      const data = await uploadImage(file);
      setImages((prev) => {
        const current = prev.find(isProductsPageImage);
        return [
          {
            object_key: data.object_key,
            thumb_object_key: data.thumb_object_key,
            size_id: null,
            type_id: null,
            kind: "",
            sort_order: 0,
            preview_url: data.url,
            thumb_url: data.thumb_url,
          },
          ...prev.filter((img) => img !== current),
        ];
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function promoteToProductsPageImage(objectKey: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.object_key === objectKey);
      if (!target) return prev;
      return [target, ...prev.filter((img) => img !== target)];
    });
  }

  const variantSections = types.flatMap((tp) =>
    sizes
      .filter((size) => variantKeys.has(variantKey(tp.id, size.id)))
      .map((size) => ({ type: tp, size })),
  );

  function buildPayload() {
    // Tile and decoration images follow variant order so the first variant's
    // decoration stands in on the products page when no products page image
    // is set; products page images keep their order here, the first one used.
    const variantOrder = new Map(
      variantSections.map(({ type: tp, size }, i) => [variantKey(tp.id, size.id), i]),
    );
    const productsPageOrder = new Map(
      images.filter(isProductsPageImage).map((img, i) => [img.object_key, i]),
    );
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
        kind: img.kind,
        sort_order: isProductsPageImage(img)
          ? (productsPageOrder.get(img.object_key) ?? img.sort_order)
          : img.kind && img.type_id && img.size_id
            ? (variantOrder.get(variantKey(img.type_id, img.size_id)) ?? img.sort_order)
            : img.sort_order,
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
  const [productsPageImage, ...otherProductsPageImages] = images.filter(isProductsPageImage);

  function renderOlderImages(
    list: PendingImage[],
    actions: (img: PendingImage) => ReactNode,
  ) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {list.map((img) => (
          <div key={img.object_key}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumb_url || img.preview_url}
              alt=""
              className="aspect-square w-full rounded-none object-cover"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">{actions(img)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <TranslationTabs active={tab} onChange={setTab} />
      <input
        placeholder="Title"
        required={tab === "en"}
        value={t.title}
        onChange={(e) => updateTranslation(tab, { title: e.target.value })}
        className="w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
        dir={tab === "fa" ? "rtl" : "ltr"}
      />
      <input
        placeholder="Alt text"
        value={t.alt_text}
        onChange={(e) => updateTranslation(tab, { alt_text: e.target.value })}
        className="w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
        dir={tab === "fa" ? "rtl" : "ltr"}
      />
      <textarea
        placeholder="Caption"
        value={t.caption}
        onChange={(e) => updateTranslation(tab, { caption: e.target.value })}
        className="w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
        dir={tab === "fa" ? "rtl" : "ltr"}
      />

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          Sort order
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="block text-sm font-medium">
          Status
          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-none border border-gray-200 px-3 py-2.5 font-normal hover:bg-gray-50">
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
          className="mt-1 w-full rounded-none border border-gray-200 bg-shell px-3 py-2 text-sm"
        >
          <option value="">No brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {brandLabel(b)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="rounded-none border border-gray-200 p-4">
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

      <fieldset className="rounded-none border border-gray-200 p-4">
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
                className="flex cursor-pointer items-center gap-3 rounded-none border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50"
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

      <fieldset className="rounded-none border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Products page image</legend>
        <ImageSlot
          title="Product card"
          hint="Shown only on this product's card on the products page and home page, not on the product's own page. If empty, the first size's decoration image is used."
          aspect={1}
          image={productsPageImage}
          disabled={isUploading}
          onUpload={uploadProductsPageImage}
          onRemove={() => productsPageImage && removeImage(productsPageImage.object_key)}
        />
        {otherProductsPageImages.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-900">Other images</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Uploaded earlier and not shown anywhere. Use one for the product
              card instead or remove them.
            </p>
            {renderOlderImages(otherProductsPageImages, (img) => (
              <>
                <button
                  type="button"
                  onClick={() => promoteToProductsPageImage(img.object_key)}
                  className={smallButtonClass}
                >
                  Use for product card
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.object_key)}
                  className={smallButtonClass}
                >
                  Remove
                </button>
              </>
            ))}
          </div>
        )}
      </fieldset>

      {variantSections.length > 0 && (
        <p className="text-xs text-gray-500">
          These images appear on the product&apos;s own page. Each size needs a
          tile image (the design itself, cropped to the size&apos;s aspect ratio
          so the sizes compare correctly on the site) and a decoration image
          (the size installed in a room).
        </p>
      )}

      {variantSections.map(({ type: tp, size }) => {
        const tile = images.find((img) => inSlot(img, tp.id, size.id, "tile"));
        const decor = images.find((img) => inSlot(img, tp.id, size.id, "decor"));
        const older = images.filter((img) => inSlot(img, tp.id, size.id, ""));
        return (
          <fieldset
            key={`${tp.id}-${size.id}`}
            className="rounded-none border border-gray-200 p-4"
          >
            <legend className="px-1 text-sm font-medium">
              {typeLabel(tp)} — {size.label}
            </legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageSlot
                title="Tile image"
                hint={`Crop to ${aspectLabel(size)}.`}
                aspect={size.width_mm / size.height_mm}
                image={tile}
                disabled={isUploading}
                warningFor={(ratio) => aspectWarning(size, ratio)}
                onUpload={(file) => uploadToSlot(file, tp.id, size.id, "tile")}
                onRemove={() => removeFromSlot(tp.id, size.id, "tile")}
              />
              <ImageSlot
                title="Decoration image"
                hint="Installed in a room. Shown wide (16:9)."
                aspect={DECOR_ASPECT}
                image={decor}
                disabled={isUploading}
                onUpload={(file) => uploadToSlot(file, tp.id, size.id, "decor")}
                onRemove={() => removeFromSlot(tp.id, size.id, "decor")}
              />
            </div>
            {older.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-900">Older images</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Uploaded before tile and decoration images existed. Use them
                  for a slot above or remove them. Until then the first one is
                  shown as the decoration.
                </p>
                {renderOlderImages(older, (img) => (
                  <>
                    <button
                      type="button"
                      onClick={() => assignOlderImage(img.object_key, "tile")}
                      className={smallButtonClass}
                    >
                      Use as tile
                    </button>
                    <button
                      type="button"
                      onClick={() => assignOlderImage(img.object_key, "decor")}
                      className={smallButtonClass}
                    >
                      Use as decoration
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.object_key)}
                      className={smallButtonClass}
                    >
                      Remove
                    </button>
                  </>
                ))}
              </div>
            )}
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
        className="cursor-pointer rounded-none bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
