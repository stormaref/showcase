"use client";

import { useSyncExternalStore } from "react";
import type { MapLinks } from "@/lib/brand-info";

type Platform = "android" | "apple" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iPadOS reports itself as a Mac; both open Apple Maps links in Maps.
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) return "apple";
  return "other";
}

const subscribe = () => () => {};

/**
 * "View on map" without a picker of our own: Android gets a geo: link so the
 * system offers the visitor's map apps, Apple devices get an Apple Maps link
 * the Maps app opens, and other browsers (which have no system handler) get
 * the web link. The server renders the web link; the device's own form is
 * swapped in after hydration.
 */
export function MapLink({
  links,
  className,
  children,
}: {
  links: MapLinks;
  className?: string;
  children: React.ReactNode;
}) {
  const platform = useSyncExternalStore<Platform>(subscribe, detectPlatform, () => "other");
  const href = platform === "android" ? links.geo : platform === "apple" ? links.apple : links.web;
  const external = /^https?:/i.test(href);

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
