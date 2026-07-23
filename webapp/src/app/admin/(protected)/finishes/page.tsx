"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { AdminSurfaceFinish } from "@/lib/api";

type FinishForm = {
  name_en: string;
  name_fa: string;
  sort_order: string;
};

const emptyForm = (): FinishForm => ({ name_en: "", name_fa: "", sort_order: "0" });

export default function AdminFinishesPage() {
  const [finishes, setFinishes] = useState<AdminSurfaceFinish[]>([]);
  const [form, setForm] = useState<FinishForm>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function load() {
    adminFetch<{ items: AdminSurfaceFinish[] }>("/api/v1/admin/finishes").then((d) =>
      setFinishes(d.items),
    );
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(f: AdminSurfaceFinish) {
    setEditId(f.id);
    setForm({
      name_en: f.translations?.en?.name ?? f.name ?? "",
      name_fa: f.translations?.fa?.name ?? "",
      sort_order: String(f.sort_order ?? 0),
    });
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm());
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name_en.trim()) {
      setError("English name is required.");
      return;
    }
    const body = {
      sort_order: parseInt(form.sort_order, 10) || 0,
      translations: {
        en: { name: form.name_en.trim() },
        ...(form.name_fa.trim() ? { fa: { name: form.name_fa.trim() } } : {}),
      },
    };
    try {
      if (editId) {
        await adminFetch(`/api/v1/admin/finishes/${editId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/v1/admin/finishes", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this surface finish?")) return;
    setError("");
    try {
      await adminFetch(`/api/v1/admin/finishes/${id}`, { method: "DELETE" });
      if (editId === id) cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Surface finishes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage surface finish tags (e.g. polished, matte). Finishes in use cannot be deleted.
      </p>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="mt-8 max-w-lg space-y-4 rounded-none border border-gray-200 bg-white p-6"
      >
        <h2 className="text-sm font-medium text-gray-900">
          {editId ? "Edit finish" : "Add finish"}
        </h2>
        <label className="block text-sm font-medium">
          English name
          <input
            required
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Persian name (optional)
          <input
            value={form.name_fa}
            onChange={(e) => setForm((f) => ({ ...f, name_fa: e.target.value }))}
            className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
            dir="rtl"
          />
        </label>
        <label className="block text-sm font-medium">
          Sort order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
            className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-white"
          >
            {editId ? "Save changes" : "Add finish"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-none border border-gray-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-12 overflow-hidden rounded-none border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">Persian</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {finishes.map((f) => (
              <tr key={f.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">
                  {f.translations?.en?.name ?? f.name}
                </td>
                <td className="px-4 py-3 text-gray-500" dir="rtl">
                  {f.translations?.fa?.name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{f.sort_order ?? 0}</td>
                <td className="px-4 py-3">
                  {f.in_use ? (
                    <span className="text-xs text-amber-700">In use</span>
                  ) : (
                    <span className="text-xs text-gray-400">Available</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <button
                    type="button"
                    onClick={() => startEdit(f)}
                    className="me-3 text-xs text-gray-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {finishes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No finishes yet. Add your first surface finish above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
