import Link from "next/link";
import { apiFetch, type BlogPost, type GalleryItem, type Paginated } from "@/lib/api";

export const metadata = {
  title: "Showcase — Welcome",
  description: "A minimal company showcase of our work and stories.",
};

export default async function HomePage() {
  let posts: BlogPost[] = [];
  let gallery: GalleryItem[] = [];
  try {
    const postData = await apiFetch<Paginated<BlogPost>>(
      "/api/v1/public/posts?limit=3",
      { next: { revalidate: 60 } },
    );
    posts = postData.items;
    const galleryData = await apiFetch<{ items: GalleryItem[] }>(
      "/api/v1/public/gallery",
      { next: { revalidate: 60 } },
    );
    gallery = galleryData.items.slice(0, 6);
  } catch {
    /* API may be offline during dev */
  }

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
          Company showcase
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          Crafted with clarity
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
          We design and build thoughtful digital experiences. Explore our gallery
          and read the latest from our team.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/gallery"
            className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            View gallery
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300"
          >
            Read blog
          </Link>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Gallery</h2>
            <Link href="/gallery" className="text-sm text-gray-500 hover:text-gray-900">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumb_url || item.image_url}
                  alt={item.alt_text || item.title}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="p-4 text-sm font-medium text-gray-800">
                  {item.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Latest posts</h2>
              <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">
                View all →
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:underline">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                      {post.excerpt}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
