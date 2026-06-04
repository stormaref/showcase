"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ posts: 0, designs: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [posts, designs] = await Promise.all([
          adminFetch<{ total: number }>("/api/v1/admin/posts?limit=1"),
          adminFetch<{ items: unknown[] }>("/api/v1/admin/designs"),
        ]);
        setStats({ posts: posts.total, designs: designs.items.length });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-gray-500">Manage your showcase content.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/posts"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-300"
        >
          <p className="text-3xl font-semibold">{stats.posts}</p>
          <p className="mt-1 text-sm text-gray-500">Blog posts</p>
        </Link>
        <Link
          href="/admin/designs"
          className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-300"
        >
          <p className="text-3xl font-semibold">{stats.designs}</p>
          <p className="mt-1 text-sm text-gray-500">Designs</p>
        </Link>
      </div>
    </div>
  );
}
