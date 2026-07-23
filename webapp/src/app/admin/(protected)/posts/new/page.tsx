"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { BlogEditor } from "@/components/admin/blog-editor";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import { adminFetch } from "@/lib/admin-api";
import type { PostTranslation } from "@/lib/api";
import {
  type LocaleTab,
  postTranslationsFromRecord,
} from "@/lib/translations";

export default function NewPostPage() {
  const router = useRouter();
  const editorRefs = useRef<Record<LocaleTab, MDXEditorMethods | null>>({
    en: null,
    fa: null,
  });
  const [tab, setTab] = useState<LocaleTab>("en");
  const [translations, setTranslations] = useState(
    postTranslationsFromRecord(),
  );
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateTranslation(locale: LocaleTab, patch: Partial<PostTranslation>) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], ...patch },
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const enMd =
      editorRefs.current.en?.getMarkdown() ?? translations.en.content_md ?? "";
    const faMd =
      editorRefs.current.fa?.getMarkdown() ?? translations.fa.content_md ?? "";
    try {
      const payload: Record<string, unknown> = {
        status,
        translations: {
          en: { ...translations.en, content_md: enMd },
        },
      };
      if (translations.fa.title || faMd) {
        (payload.translations as Record<string, PostTranslation>).fa = {
          ...translations.fa,
          content_md: faMd,
        };
      }
      const post = await adminFetch<{ id: string }>("/api/v1/admin/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/admin/posts/${post.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const t = translations[tab];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
      {error && (
        <p className="mt-4 rounded-none bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="mt-4">
        <TranslationTabs active={tab} onChange={setTab} />
      </div>
      <div className="mt-6 space-y-4">
        <input
          placeholder="Title"
          value={t.title}
          onChange={(e) => updateTranslation(tab, { title: e.target.value })}
          className="w-full rounded-none border border-gray-200 px-3 py-2 text-lg font-medium"
        />
        <input
          placeholder="Slug (optional)"
          value={t.slug}
          onChange={(e) => updateTranslation(tab, { slug: e.target.value })}
          className="w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <textarea
          placeholder="Excerpt"
          value={t.excerpt}
          onChange={(e) => updateTranslation(tab, { excerpt: e.target.value })}
          rows={2}
          className="w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <BlogEditor
          key={tab}
          ref={(el) => {
            editorRefs.current[tab] = el;
          }}
          markdown=""
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="SEO title"
            value={t.meta_title}
            onChange={(e) => updateTranslation(tab, { meta_title: e.target.value })}
            className="rounded-none border border-gray-200 px-3 py-2 text-sm"
            dir={tab === "fa" ? "rtl" : "ltr"}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded-none border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <textarea
          placeholder="SEO description"
          value={t.meta_description}
          onChange={(e) =>
            updateTranslation(tab, { meta_description: e.target.value })
          }
          rows={2}
          className="w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || !translations.en.title}
          className="rounded-none bg-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save post"}
        </button>
      </div>
    </div>
  );
}
