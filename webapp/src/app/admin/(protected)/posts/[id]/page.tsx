"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { BlogEditor } from "@/components/admin/blog-editor";
import { adminFetch } from "@/lib/admin-api";
import type { BlogPost } from "@/lib/api";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch<BlogPost>(`/api/v1/admin/posts/${id}`).then((p) => {
      setPost(p);
      setTitle(p.title);
      setExcerpt(p.excerpt);
      setSlug(p.slug);
      setStatus(p.status);
      setMetaTitle(p.meta_title);
      setMetaDescription(p.meta_description);
    });
  }, [id]);

  async function save() {
    setSaving(true);
    const content_md = editorRef.current?.getMarkdown() ?? post?.content_md ?? "";
    await adminFetch(`/api/v1/admin/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title,
        excerpt,
        slug,
        content_md,
        status,
        meta_title: metaTitle,
        meta_description: metaDescription,
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
      <div className="mt-6 space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-lg font-medium"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <BlogEditor key={post.id} ref={editorRef} markdown={post.content_md || ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="SEO title"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          placeholder="SEO description"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
