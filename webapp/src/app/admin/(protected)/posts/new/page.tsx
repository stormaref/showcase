"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { BlogEditor } from "@/components/admin/blog-editor";
import { adminFetch } from "@/lib/admin-api";

export default function NewPostPage() {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const content_md = editorRef.current?.getMarkdown() ?? "";
    try {
      const post = await adminFetch<{ id: string }>("/api/v1/admin/posts", {
        method: "POST",
        body: JSON.stringify({
          title,
          excerpt,
          slug: slug || undefined,
          content_md,
          status,
          meta_title: metaTitle,
          meta_description: metaDescription,
        }),
      });
      router.push(`/admin/posts/${post.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="mt-6 space-y-4">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-lg font-medium"
        />
        <input
          placeholder="Slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <BlogEditor ref={editorRef} markdown="" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="SEO title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <textarea
          placeholder="SEO description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || !title}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save post"}
        </button>
      </div>
    </div>
  );
}
