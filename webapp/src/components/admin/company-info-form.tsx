"use client";

import { Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import { useUploadProgress } from "@/components/admin/upload-progress-context";
import { adminFetch } from "@/lib/admin-api";
import type { BrandInfoResponse, BrandInfoTranslations, HeroTextTone } from "@/lib/api";

type Tab = "en" | "fa";

type BrandFields = {
  name: string;
  tagline: string;
  about: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  phone: string;
  email: string;
  hours: string;
};

/** Contact channels shared by every locale, saved on each row like the hero. */
type Channels = {
  whatsapp: string;
  instagram: string;
  telegram: string;
  map_url: string;
  map_embed_url: string;
};

const emptyChannels = (): Channels => ({
  whatsapp: "",
  instagram: "",
  telegram: "",
  map_url: "",
  map_embed_url: "",
});

const emptyFields = (): BrandFields => ({
  name: "",
  tagline: "",
  about: "",
  address_line_1: "",
  address_line_2: "",
  address_line_3: "",
  phone: "",
  email: "",
  hours: "",
});

function fieldsFromResponse(row?: BrandInfoResponse): BrandFields {
  if (!row) return emptyFields();
  return {
    name: row.name,
    tagline: row.tagline,
    about: row.about,
    address_line_1: row.address_line_1,
    address_line_2: row.address_line_2,
    address_line_3: row.address_line_3,
    phone: row.phone,
    email: row.email,
    hours: row.hours ?? "",
  };
}

const inputClass =
  "mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm";

export function CompanyInfoForm() {
  const [tab, setTab] = useState<Tab>("en");
  const [en, setEn] = useState<BrandFields>(emptyFields());
  const [fa, setFa] = useState<BrandFields>(emptyFields());
  const [heroKey, setHeroKey] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const [heroTone, setHeroTone] = useState<HeroTextTone>("dark");
  const [channels, setChannels] = useState<Channels>(emptyChannels());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [saved, setSaved] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useUploadProgress();

  useEffect(() => {
    adminFetch<{ translations: BrandInfoTranslations }>("/api/v1/admin/brand-info")
      .then((data) => {
        setEn(fieldsFromResponse(data.translations.en));
        setFa(fieldsFromResponse(data.translations.fa));
        const row = data.translations.en ?? data.translations.fa;
        setHeroKey(row?.hero_image_object_key ?? "");
        setHeroUrl(row?.hero_image_url ?? "");
        setHeroTone(row?.hero_text_tone === "light" ? "light" : "dark");
        setChannels({
          whatsapp: row?.whatsapp ?? "",
          instagram: row?.instagram ?? "",
          telegram: row?.telegram ?? "",
          map_url: row?.map_url ?? "",
          map_embed_url: row?.map_embed_url ?? "",
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load brand info");
      })
      .finally(() => setLoading(false));
  }, []);

  const fields = tab === "en" ? en : fa;
  const setFields = tab === "en" ? setEn : setFa;

  function updateField(key: keyof BrandFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function updateChannel(key: keyof Channels, value: string) {
    setChannels((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleHero(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    setSaved(false);
    try {
      const data = await uploadImage(file);
      setHeroKey(data.object_key);
      setHeroUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await adminFetch("/api/v1/admin/brand-info", {
        method: "PUT",
        body: JSON.stringify({
          translations: {
            en: { ...en, ...channels, hero_image_object_key: heroKey, hero_text_tone: heroTone },
            // Leave fa untouched when it is unused so the public API keeps
            // falling back to the English row.
            fa: {
              ...fa,
              ...channels,
              hero_image_object_key: fa.name.trim() ? heroKey : "",
              hero_text_tone: heroTone,
            },
          },
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-2xl space-y-6">
      <fieldset className="rounded-none border border-gray-200 bg-white p-6">
        <legend className="px-1 text-sm font-medium">Home hero image</legend>
        <p className="text-xs text-gray-500">
          Shown full-width at the top of the home page. When empty, the site
          uses its built-in default photo.
        </p>
        <div className="mt-4">
          {heroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroUrl}
              alt=""
              className="aspect-[3/1] w-full rounded-none border border-gray-100 object-cover"
            />
          ) : (
            <div className="flex aspect-[3/1] w-full items-center justify-center rounded-none border border-dashed border-gray-200 text-xs text-gray-400">
              Default image in use
            </div>
          )}
          <div className="mt-3">
            <input
              ref={heroInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleHero}
              className="sr-only"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => heroInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-none border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="size-4" aria-hidden />
              {heroUrl ? "Replace image" : "Upload image"}
            </button>
            {heroUrl && (
              <button
                type="button"
                onClick={() => {
                  setHeroKey("");
                  setHeroUrl("");
                  setSaved(false);
                }}
                className="ms-3 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>
        <div className="mt-6">
          <p className="text-sm font-medium">Text colour on the image</p>
          <p className="text-xs text-gray-500">
            Pick dark text for a light photo and light text for a dark one.
          </p>
          <div className="mt-2 flex gap-6">
            {(
              [
                ["dark", "Dark text"],
                ["light", "Light text"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="hero-text-tone"
                  value={value}
                  checked={heroTone === value}
                  onChange={() => {
                    setHeroTone(value);
                    setSaved(false);
                  }}
                  className="accent-clay"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-none border border-gray-200 bg-white p-6">
        <legend className="px-1 text-sm font-medium">Contact channels</legend>
        <p className="text-xs text-gray-500">
          Shared by both languages. Leave a field empty to hide it on the site.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium">
            WhatsApp number
            <input
              type="tel"
              dir="ltr"
              placeholder="0912 345 6789"
              value={channels.whatsapp}
              onChange={(e) => updateChannel("whatsapp", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Instagram
            <input
              dir="ltr"
              placeholder="@yourpage or https://instagram.com/yourpage"
              value={channels.instagram}
              onChange={(e) => updateChannel("instagram", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Telegram
            <input
              dir="ltr"
              placeholder="@yourchannel or https://t.me/yourchannel"
              value={channels.telegram}
              onChange={(e) => updateChannel("telegram", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Map link
            <input
              type="url"
              dir="ltr"
              placeholder="https://nshn.ir/… or a Google Maps link"
              value={channels.map_url}
              onChange={(e) => updateChannel("map_url", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Google Maps embed (About page)
            <textarea
              rows={3}
              dir="ltr"
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=…"></iframe>'
              value={channels.map_embed_url}
              onChange={(e) => updateChannel("map_embed_url", e.target.value)}
              className={`${inputClass} font-mono text-xs`}
            />
            <span className="mt-1 block text-xs font-normal text-gray-500">
              In Google Maps, open your location → Share → Embed a map → Copy HTML, and paste
              it here. The map shows on the About page only when this is set.
            </span>
          </label>
        </div>
      </fieldset>

      <TranslationTabs active={tab} onChange={setTab} hasFa={Boolean(fa.name)} />

      <div className="space-y-4 rounded-none border border-gray-200 bg-white p-6">
        <label className="block text-sm font-medium">
          Name {tab === "en" && <span className="text-red-600">*</span>}
          <input
            required={tab === "en"}
            value={fields.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Tagline
          <input
            value={fields.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          About
          <textarea
            rows={4}
            value={fields.about}
            onChange={(e) => updateField("about", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Address line 1
          <input
            value={fields.address_line_1}
            onChange={(e) => updateField("address_line_1", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Address line 2
          <input
            value={fields.address_line_2}
            onChange={(e) => updateField("address_line_2", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Address line 3
          <input
            value={fields.address_line_3}
            onChange={(e) => updateField("address_line_3", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input
            type="tel"
            value={fields.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Email {tab === "en" && <span className="text-red-600">*</span>}
          <input
            type="email"
            required={tab === "en"}
            value={fields.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Opening hours
          <input
            placeholder={tab === "en" ? "Sat–Wed 9:00–17:00" : "شنبه تا چهارشنبه ۹ تا ۱۷"}
            value={fields.hours}
            onChange={(e) => updateField("hours", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Brand info saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save brand info"}
      </button>
    </form>
  );
}
