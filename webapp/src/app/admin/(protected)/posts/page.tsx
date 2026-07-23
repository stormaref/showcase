"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { BlogPost, Paginated } from "@/lib/api";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    adminFetch<Paginated<BlogPost>>("/api/v1/admin/posts?limit=50").then((d) =>
      setPosts(d.items),
    );
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog posts</h1>
          <p className="mt-1 text-sm text-gray-500">Create and publish markdown posts.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-clay"
        >
          New post
        </Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-none border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">
                  {p.title}
                  {p.has_fa && (
                    <span className="ms-2 rounded-none bg-clay-soft px-1.5 py-0.5 text-xs font-normal text-clay-dark">
                      FA
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize text-gray-500">{p.status}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
