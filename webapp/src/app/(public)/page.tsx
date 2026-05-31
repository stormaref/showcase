import Link from "next/link";
import { company } from "@/lib/company";
import { apiFetch, type BlogPost, type GalleryItem, type Paginated } from "@/lib/api";

export const metadata = {
  title: "Welcome",
  description:
    "Art Ceramic — handcrafted ceramics, custom tiles, and studio services. Visit our gallery and blog.",
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
          Ceramic studio
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
          {company.name}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
          {company.tagline}
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

      <section className="border-t border-gray-100 bg-gray-50/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            About us
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            {company.about}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
          Our services
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          What we offer at the studio and for your projects.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {company.services.map((service) => (
            <li
              key={service.title}
              className="rounded-lg border border-gray-100 bg-white p-6"
            >
              <h3 className="font-medium text-gray-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-gray-100 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
            Contact
          </h2>
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-6 text-center text-gray-600">
            <address className="not-italic leading-relaxed">
              {company.address.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p>
              <a
                href={`tel:${company.phoneTel}`}
                className="font-medium text-gray-900 hover:underline"
              >
                {company.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${company.email}`}
                className="text-gray-500 hover:text-gray-900 hover:underline"
              >
                {company.email}
              </a>
            </p>
          </div>
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
