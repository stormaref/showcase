"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UploadProgressBar } from "@/components/admin/upload-progress-bar";
import {
  UploadProgressProvider,
  useUploadProgress,
} from "@/components/admin/upload-progress-context";
import { fetchCsrf, logout, refreshSession } from "@/lib/admin-api";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Blog posts" },
  { href: "/admin/gallery", label: "Gallery" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await refreshSession();
      if (cancelled) return;
      if (!ok) {
        router.replace("/admin/login");
        return;
      }
      await fetchCsrf();
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <UploadProgressProvider>
      <AdminShellLayout pathname={pathname} router={router}>
        {children}
      </AdminShellLayout>
    </UploadProgressProvider>
  );
}

function AdminShellLayout({
  children,
  pathname,
  router,
}: {
  children: React.ReactNode;
  pathname: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { isUploading, percent } = useUploadProgress();

  return (
    <div className="flex min-h-screen">
      <aside className="relative flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-5">
          <p className="font-semibold tracking-tight">Showcase Admin</p>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                pathname === item.href
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/admin/login");
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {isUploading && percent !== null && (
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-8 py-2">
            <UploadProgressBar percent={percent} label="Uploading image…" />
          </div>
        )}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
