import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Camera,
  Clock,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  Send,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { routing, type Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import heroImage from "@/assets/images/home-hero.jpg";
import { BrandGrid } from "@/components/brand-grid";
import { apiFetch, type BlogPost, type Design, type Paginated } from "@/lib/api";
import {
  getBrandInfo,
  getSiteName,
  instagramHref,
  phoneTelHref,
  telegramHref,
  whatsappHref,
} from "@/lib/brand-info";
import { getBrands } from "@/lib/brands";
import { formatDate, localizeDigits } from "@/lib/format";
import { buildPageMetadata } from "@/lib/metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const brand = await getBrandInfo(locale);
  return buildPageMetadata({
    locale,
    path: "/",
    title: t("homeTitle"),
    description: t("homeDescription", { name: brand.name }),
    siteName: await getSiteName(),
  });
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
      <div className="max-w-xl">
        <h2 className="text-3xl font-light tracking-tight text-ink md:text-4xl rtl:leading-[1.35]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-base font-light leading-relaxed text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function QuietLink({ href, children }: { href: "/products" | "/blog"; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 cursor-pointer items-center gap-2 pb-1 text-[13px] font-medium uppercase tracking-[0.18em] text-ink transition hover:text-clay"
    >
      {children}
      <ArrowRight
        className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden
      />
    </Link>
  );
}

/** "@handle" for display, whether the admin entered a handle or a profile URL. */
function handleLabel(value: string): string {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return v.startsWith("@") ? v : `@${v}`;
  try {
    const first = new URL(v).pathname.split("/").filter(Boolean)[0];
    return first ? `@${first}` : v;
  } catch {
    return v;
  }
}

type ContactItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  href?: string;
  wide?: boolean;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }
  const t = await getTranslations("home");
  const c = await getTranslations("contact");
  const brand = await getBrandInfo(locale);
  const brands = await getBrands(locale);

  const services = [
    { title: t("services.designsTitle"), description: t("services.designsDesc") },
    { title: t("services.sizesTitle"), description: t("services.sizesDesc") },
    { title: t("services.brandsTitle"), description: t("services.brandsDesc") },
    { title: t("services.applicationsTitle"), description: t("services.applicationsDesc") },
    { title: t("services.guidanceTitle"), description: t("services.guidanceDesc") },
    { title: t("services.supplyTitle"), description: t("services.supplyDesc") },
  ];

  let posts: BlogPost[] = [];
  let designs: Design[] = [];
  try {
    const postData = await apiFetch<Paginated<BlogPost>>(
      "/api/v1/public/posts?limit=3",
      { locale: locale as string, next: { revalidate: 60 } },
    );
    posts = postData.items;
    const designData = await apiFetch<{ items: Design[] }>(
      "/api/v1/public/designs",
      { locale: locale as string, next: { revalidate: 60 } },
    );
    designs = designData.items
      .filter((design) => design.primary_image_url || design.primary_thumb_url)
      .slice(0, 4);
  } catch {
    /* API may be offline during dev */
  }

  // Admin picks the hero type colour to suit the photo: dark on light images.
  const heroDark = brand.heroTextTone === "dark";
  const phoneDisplay = localizeDigits(brand.phone, locale);

  // Admin text keeps blank lines between paragraphs; render them as such.
  const aboutParagraphs = brand.about
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const address = [brand.addressLine1, brand.addressLine2, brand.addressLine3]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(locale === "fa" ? "، " : ", ");

  // Each row shows only when the admin filled it in.
  const contactItems: ContactItem[] = [];
  if (address) {
    contactItems.push({
      key: "address",
      icon: MapPin,
      label: c("address"),
      value: <address className="not-italic">{localizeDigits(address, locale)}</address>,
      wide: true,
    });
  }
  const whatsapp = whatsappHref(brand.whatsapp);
  if (whatsapp) {
    contactItems.push({
      key: "whatsapp",
      icon: MessageCircle,
      label: c("whatsapp"),
      value: <bdi dir="ltr">{localizeDigits(brand.whatsapp, locale)}</bdi>,
      href: whatsapp,
    });
  }
  const instagram = instagramHref(brand.instagram);
  if (instagram) {
    contactItems.push({
      key: "instagram",
      icon: Camera,
      label: c("instagram"),
      value: <bdi dir="ltr">{handleLabel(brand.instagram)}</bdi>,
      href: instagram,
    });
  }
  const telegram = telegramHref(brand.telegram);
  if (telegram) {
    contactItems.push({
      key: "telegram",
      icon: Send,
      label: c("telegram"),
      value: <bdi dir="ltr">{handleLabel(brand.telegram)}</bdi>,
      href: telegram,
    });
  }
  if (brand.mapUrl.trim()) {
    contactItems.push({
      key: "map",
      icon: MapPinned,
      label: c("map"),
      value: c("viewOnMap"),
      href: brand.mapUrl.trim(),
    });
  }
  if (brand.hours.trim()) {
    contactItems.push({
      key: "hours",
      icon: Clock,
      label: c("hours"),
      value: <span className="whitespace-pre-line">{localizeDigits(brand.hours.trim(), locale)}</span>,
    });
  }
  const hasContact = Boolean(brand.phone || brand.email || contactItems.length);

  return (
    <>
      {/* Hero — full-screen image header with overlaid type. It fills exactly
          the viewport left under the sticky header (svh so mobile browser
          chrome never causes overflow). The image is admin-managed (company
          info); the bundled photo is the fallback. */}
      <section className="relative h-[calc(100svh-var(--header-h))] min-h-[28rem] w-full overflow-hidden">
        <Image
          src={brand.heroImageUrl || heroImage}
          alt={t("heroAlt")}
          fill
          preload
          placeholder={brand.heroImageUrl ? "empty" : "blur"}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-6 pb-[calc(3rem+env(safe-area-inset-bottom))] md:px-10 md:pb-20">
            <h1
              className={`max-w-3xl text-[2rem] font-extralight leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl rtl:leading-[1.35] ${heroDark ? "text-ink" : "text-white"}`}
            >
              {brand.tagline}
            </h1>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-9">
              <Link
                href="/products"
                className="cursor-pointer bg-clay px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-clay-dark md:px-10 md:py-4 md:text-sm"
              >
                {t("viewDesigns")}
              </Link>
              {brand.phone && (
                <a
                  href={phoneTelHref(brand.phone)}
                  aria-label={c("callAria", { phone: phoneDisplay })}
                  className={`inline-flex cursor-pointer items-center gap-2.5 text-[13px] font-medium tracking-[0.12em] transition ${heroDark ? "text-ink hover:text-clay" : "text-white hover:text-clay-soft"}`}
                >
                  <Phone className="size-4" aria-hidden />
                  <bdi dir="ltr">{phoneDisplay}</bdi>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Collection mosaic — full-bleed tiles under a regular section header */}
      {designs.length > 0 && (
        <section>
          <div className="mx-auto max-w-7xl px-6 pb-12 pt-24 md:px-10 md:pb-14 md:pt-32">
            <SectionHeader
              title={t("designsTitle")}
              subtitle={t("designsSubtitle")}
              action={<QuietLink href="/products">{t("viewAll")}</QuietLink>}
            />
          </div>
          <div className="grid grid-cols-2 gap-px bg-paper lg:grid-cols-4">
            {designs.map((design) => (
              <Link
                key={design.id}
                href={`/products/${design.id}`}
                className="group relative block aspect-[3/4] cursor-pointer overflow-hidden bg-gray-100"
              >
                <Image
                  src={design.primary_image_url || design.primary_thumb_url}
                  alt={design.alt_text || design.title}
                  fill
                  sizes="(min-width:1024px) 25vw, 50vw"
                  className="object-cover motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent p-5 pt-14">
                  {design.brand?.name && (
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                      {design.brand.name}
                    </p>
                  )}
                  <p className="mt-1 text-lg font-light text-white">{design.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About — stone band; the admin's paragraphs read as prose */}
      {aboutParagraphs.length > 0 && (
        <section className="border-y border-gray-200 bg-cream">
          <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
            <div className="mx-auto max-w-prose">
              <p className="eyebrow">{t("aboutTitle")}</p>
              <h2 className="mt-5 text-3xl font-light tracking-tight text-ink md:text-4xl rtl:leading-[1.35]">
                {brand.name}
              </h2>
              <div className="mt-10 space-y-6 text-start">
                {aboutParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={
                      index === 0 && aboutParagraphs.length > 1
                        ? "whitespace-pre-line text-xl font-light leading-loose text-ink md:text-2xl"
                        : "whitespace-pre-line text-lg font-light leading-loose text-gray-700 md:text-xl"
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services — quiet hairline grid */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <SectionHeader title={t("servicesTitle")} subtitle={t("servicesSubtitle")} />
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.title} className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-medium text-ink">{service.title}</h3>
              <p className="mt-3 text-[15px] font-light leading-relaxed text-gray-500">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Brands — stone band; a single brand gets a centred feature */}
      {brands.length > 0 && (
        <section className="border-y border-gray-200 bg-cream">
          <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
            <SectionHeader title={t("brandsTitle")} subtitle={t("brandsSubtitle")} />
            <BrandGrid
              brands={brands}
              visitLabel={t("brandsVisit")}
              productsLabel={t("viewAll")}
              className="mt-14"
            />
          </div>
        </section>
      )}

      {/* Journal */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
          <SectionHeader
            title={t("latestPosts")}
            action={<QuietLink href="/blog">{t("viewAll")}</QuietLink>}
          />
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="border-t border-gray-200 pt-6">
                <Link href={`/blog/${post.slug}`} className="group block cursor-pointer">
                  {post.og_image_url && (
                    <div className="relative mb-6 aspect-[16/10] overflow-hidden bg-gray-100">
                      <Image
                        src={post.og_image_url}
                        alt=""
                        fill
                        sizes="(min-width:768px) 33vw, 100vw"
                        className="object-cover motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-105"
                      />
                    </div>
                  )}
                  {post.published_at && (
                    <time dateTime={post.published_at} className="text-sm text-gray-500">
                      {formatDate(post.published_at, locale)}
                    </time>
                  )}
                  <h3 className="mt-3 text-xl font-light text-ink transition group-hover:text-clay rtl:leading-relaxed">
                    {post.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[15px] font-light leading-relaxed text-gray-500">
                    {post.excerpt}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Contact — paper ground with a hairline so it doesn't run into the
          cream footer. Every row is optional. */}
      {hasContact && (
        <section className="border-t border-gray-200 bg-paper">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-[2fr_3fr] lg:gap-20">
            <div>
              <p className="eyebrow">{t("contactTitle")}</p>
              <h2 className="mt-5 text-3xl font-light tracking-tight text-ink md:text-4xl rtl:leading-[1.35]">
                {c("heading")}
              </h2>
              {brand.phone && (
                <p className="mt-8">
                  <a
                    href={phoneTelHref(brand.phone)}
                    aria-label={c("callAria", { phone: phoneDisplay })}
                    className="text-3xl font-extralight tracking-tight text-ink transition hover:text-clay md:text-4xl"
                  >
                    <bdi dir="ltr">{phoneDisplay}</bdi>
                  </a>
                </p>
              )}
              {brand.email && (
                <p className="mt-5">
                  <a
                    href={`mailto:${brand.email}`}
                    className="text-base text-ink underline decoration-gray-300 underline-offset-8 transition hover:text-clay hover:decoration-clay"
                  >
                    <bdi dir="ltr">{brand.email}</bdi>
                  </a>
                </p>
              )}
            </div>
            {contactItems.length > 0 && (
              <ul className="grid content-start gap-x-10 gap-y-8 sm:grid-cols-2">
                {contactItems.map((item) => (
                  <li
                    key={item.key}
                    className={`flex gap-4 border-t border-gray-200 pt-6 ${item.wide ? "sm:col-span-2" : ""}`}
                  >
                    <item.icon className="mt-0.5 size-5 shrink-0 text-clay" strokeWidth={1.5} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-gray-500">
                        {item.label}
                      </p>
                      <div className="mt-2 text-base leading-relaxed text-ink">
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-words underline decoration-gray-300 underline-offset-4 transition hover:text-clay hover:decoration-clay"
                          >
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </>
  );
}
