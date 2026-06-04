"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { BlogEditor } from "@/components/admin/blog-editor";
import { TranslationTabs } from "@/components/admin/translation-tabs";
import { adminFetch } from "@/lib/admin-api";
import type { BlogPost, PostTranslation } from "@/lib/api";
import {
  type LocaleTab,
  postTranslationsFromRecord,
} from "@/lib/translations";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const editorRefs = useRef<Record<LocaleTab, MDXEditorMethods | null>>({
    en: null,
    fa: null,
  });
  const [post, setPost] = useState<BlogPost | null>(null);
  const [tab, setTab] = useState<LocaleTab>("en");
  const [translations, setTranslations] = useState(
    postTranslationsFromRecord(),
  );
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch<BlogPost>(`/api/v1/admin/posts/${id}`).then((p) => {
      setPost(p);
      setStatus(p.status);
      setTranslations(postTranslationsFromRecord(p.translations));
    });
  }, [id]);

  function updateTranslation(locale: LocaleTab, patch: Partial<PostTranslation>) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], ...patch },
    }));
  }

  async function save() {
    setSaving(true);
    const enMd =
      editorRefs.current.en?.getMarkdown() ?? translations.en.content_md ?? "";
    const faMd =
      editorRefs.current.fa?.getMarkdown() ?? translations.fa.content_md ?? "";
    await adminFetch(`/api/v1/admin/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        translations: {
          en: { ...translations.en, content_md: enMd },
          fa: translations.fa.title || faMd ? { ...translations.fa, content_md: faMd } : undefined,
        },
      }),
    });
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Delete this post?")) return;
    await adminFetch(`/api/v1/admin/posts/${id}`, { method: "DELETE" });
    router.push("/admin/posts");
  }

  if (!post) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const t = translations[tab];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
        <button
          type="button"
          onClick={remove}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
      <div className="mt-4">
        <TranslationTabs active={tab} onChange={setTab} hasFa={post.has_fa} />
      </div>
      <div className="mt-6 space-y-4">
        <input
          value={t.title}
          onChange={(e) => updateTranslation(tab, { title: e.target.value })}
          placeholder="Title"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-lg font-medium"
        />
        <input
          value={t.slug}
          onChange={(e) => updateTranslation(tab, { slug: e.target.value })}
          placeholder="Slug"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <textarea
          value={t.excerpt}
          onChange={(e) => updateTranslation(tab, { excerpt: e.target.value })}
          rows={2}
          placeholder="Excerpt"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <BlogEditor
          key={`${post.id}-${tab}`}
          ref={(el) => {
            editorRefs.current[tab] = el;
          }}
          markdown={t.content_md || ""}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={t.meta_title}
            onChange={(e) => updateTranslation(tab, { meta_title: e.target.value })}
            placeholder="SEO title"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            dir={tab === "fa" ? "rtl" : "ltr"}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <textarea
          value={t.meta_description}
          onChange={(e) =>
            updateTranslation(tab, { meta_description: e.target.value })
          }
          rows={2}
          placeholder="SEO description"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          dir={tab === "fa" ? "rtl" : "ltr"}
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
