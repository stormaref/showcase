import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { company } from "@/lib/company";
import { apiFetch, type BlogPost } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await apiFetch<BlogPost>(`/api/v1/public/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    return {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      openGraph: {
        siteName: company.name,
        title: post.meta_title || post.title,
        description: post.meta_description || post.excerpt,
        images: post.image_url ? [post.image_url] : undefined,
      },
    };
  } catch {
    return { title: "Post not found" };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post: BlogPost;
  try {
    post = await apiFetch<BlogPost>(`/api/v1/public/posts/${slug}`, {
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <time className="text-sm text-gray-400">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </time>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-900">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-gray-500">{post.excerpt}</p>
        )}
      </header>
      <div className="mt-12">
        {post.content_html ? (
          <MarkdownContent html={post.content_html} />
        ) : (
          <p className="text-gray-500">Content unavailable.</p>
        )}
      </div>
    </article>
  );
}
