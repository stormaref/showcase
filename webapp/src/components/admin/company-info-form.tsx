"use client";

import { FormEvent, useEffect, useState } from "react";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import { adminFetch } from "@/lib/admin-api";
import type { BrandInfoResponse, BrandInfoTranslations } from "@/lib/api";

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
};

const emptyFields = (): BrandFields => ({
  name: "",
  tagline: "",
  about: "",
  address_line_1: "",
  address_line_2: "",
  address_line_3: "",
  phone: "",
  email: "",
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
  };
}

const inputClass =
  "mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm";

export function CompanyInfoForm() {
  const [tab, setTab] = useState<Tab>("en");
  const [en, setEn] = useState<BrandFields>(emptyFields());
  const [fa, setFa] = useState<BrandFields>(emptyFields());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch<{ translations: BrandInfoTranslations }>("/api/v1/admin/brand-info")
      .then((data) => {
        setEn(fieldsFromResponse(data.translations.en));
        setFa(fieldsFromResponse(data.translations.fa));
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await adminFetch("/api/v1/admin/brand-info", {
        method: "PUT",
        body: JSON.stringify({ translations: { en, fa } }),
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
