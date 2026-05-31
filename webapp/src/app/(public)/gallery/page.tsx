import type { Metadata } from "next";
import { apiFetch, type GalleryItem } from "@/lib/api";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A curated gallery of ceramic work from Art Ceramic studio.",
};

export default async function GalleryPage() {
  let items: GalleryItem[] = [];
  try {
    const data = await apiFetch<{ items: GalleryItem[] }>(
      "/api/v1/public/gallery",
      { next: { revalidate: 60 } },
    );
    items = data.items;
  } catch {
    /* empty */
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Gallery</h1>
      <p className="mt-2 text-gray-500">Selected pieces from the Art Ceramic studio.</p>
      {items.length === 0 ? (
        <p className="mt-12 text-gray-400">No gallery items published yet.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden rounded-xl border border-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.alt_text || item.title}
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="p-5">
                <h2 className="font-medium text-gray-900">{item.title}</h2>
                {item.caption && (
                  <p className="mt-1 text-sm text-gray-500">{item.caption}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
