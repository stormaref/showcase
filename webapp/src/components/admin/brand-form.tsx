"use client";

import { Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import { UploadProgressBar } from "@/components/admin/upload-progress-bar";
import { useUploadProgress } from "@/components/admin/upload-progress-context";
import type { AdminBrand } from "@/lib/api";
import type { LocaleTab } from "@/lib/translations";

type BrandTranslationFields = { name: string; description: string };

type BrandFormProps = {
  initial?: AdminBrand;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
};

const inputClass =
  "mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm";

function translationsFromInitial(
  initial?: AdminBrand,
): Record<LocaleTab, BrandTranslationFields> {
  return {
    en: {
      name: initial?.translations?.en?.name ?? initial?.name ?? "",
      description: initial?.translations?.en?.description ?? "",
    },
    fa: {
      name: initial?.translations?.fa?.name ?? "",
      description: initial?.translations?.fa?.description ?? "",
    },
  };
}

export function BrandForm({ initial, onSubmit, submitLabel }: BrandFormProps) {
  const [tab, setTab] = useState<LocaleTab>("en");
  const [translations, setTranslations] = useState(() =>
    translationsFromInitial(initial),
  );
  const [logoObjectKey, setLogoObjectKey] = useState(
    initial?.logo_object_key ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.website_url ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { uploadImage, isUploading, percent } = useUploadProgress();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fields = translations[tab];

  function updateField(key: keyof BrandTranslationFields, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [key]: value },
    }));
  }

  async function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    try {
      const data = await uploadImage(file);
      setLogoObjectKey(data.object_key);
      setLogoUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function buildPayload() {
    const payload: Record<string, unknown> = {
      logo_object_key: logoObjectKey,
      website_url: websiteUrl.trim(),
      sort_order: sortOrder,
      is_published: isPublished,
      translations: {
        en: {
          name: translations.en.name.trim(),
          description: translations.en.description.trim(),
        },
      },
    };
    if (translations.fa.name.trim()) {
      (payload.translations as Record<string, BrandTranslationFields>).fa = {
        name: translations.fa.name.trim(),
        description: translations.fa.description.trim(),
      };
    }
    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!translations.en.name.trim()) {
      setFormError("English name is required.");
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

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
      <TranslationTabs
        active={tab}
        onChange={setTab}
        hasFa={Boolean(translations.fa.name)}
      />

      <div className="space-y-4 rounded-none border border-gray-200 bg-white p-6">
        <label className="block text-sm font-medium">
          Name {tab === "en" && <span className="text-red-600">*</span>}
          <input
            required={tab === "en"}
            value={fields.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass}
            dir={tab === "fa" ? "rtl" : "ltr"}
          />
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea
            rows={3}
            value={fields.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={inputClass}
            dir={tab === "fa" ? "rtl" : "ltr"}
          />
        </label>
      </div>

      <fieldset className="rounded-none border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">Logo</legend>
        <div className="mt-2 flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-20 rounded-none border border-gray-100 object-contain p-1"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-none border border-dashed border-gray-200 text-xs text-gray-400">
              No logo
            </div>
          )}
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogo}
              className="sr-only"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => logoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-none border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="size-4" aria-hidden />
              {logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => {
                  setLogoObjectKey("");
                  setLogoUrl("");
                }}
                className="ms-3 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Website URL
        <input
          type="url"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={inputClass}
          dir="ltr"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          Sort order
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            className={inputClass}
          />
        </label>
        <div className="block text-sm font-medium">
          Status
          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-none border border-gray-200 px-3 py-2.5 font-normal hover:bg-gray-50">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 shrink-0 rounded-none border-gray-300 accent-gray-900"
            />
            Published
          </label>
        </div>
      </div>

      {isUploading && percent !== null && (
        <UploadProgressBar percent={percent} label="Uploading logo…" />
      )}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={saving || isUploading || !translations.en.name.trim()}
        className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
