"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { TileSize } from "@/lib/api";

type SizeForm = {
  width_cm: string;
  height_cm: string;
  label: string;
};

const emptyForm = (): SizeForm => ({ width_cm: "", height_cm: "", label: "" });

export default function AdminSizesPage() {
  const [sizes, setSizes] = useState<TileSize[]>([]);
  const [form, setForm] = useState<SizeForm>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function load() {
    adminFetch<{ items: TileSize[] }>("/api/v1/admin/sizes").then((d) =>
      setSizes(d.items),
    );
  }

  useEffect(() => {
    load();
  }, []);

  function cmToMm(v: string) {
    const n = parseFloat(v);
    if (Number.isNaN(n) || n <= 0) return 0;
    return Math.round(n * 10);
  }

  function startEdit(size: TileSize) {
    setEditId(size.id);
    setForm({
      width_cm: String(size.width_mm / 10),
      height_cm: String(size.height_mm / 10),
      label: size.label,
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
    const widthMM = cmToMm(form.width_cm);
    const heightMM = cmToMm(form.height_cm);
    if (!widthMM || !heightMM) {
      setError("Width and height must be positive numbers (cm).");
      return;
    }
    const body = {
      width_mm: widthMM,
      height_mm: heightMM,
      label: form.label.trim(),
    };
    try {
      if (editId) {
        await adminFetch(`/api/v1/admin/sizes/${editId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/v1/admin/sizes", {
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
    if (!confirm("Delete this size?")) return;
    setError("");
    try {
      await adminFetch(`/api/v1/admin/sizes/${id}`, { method: "DELETE" });
      if (editId === id) cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Tile sizes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage available tile dimensions. Sizes in use cannot be changed or deleted.
      </p>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="mt-8 max-w-lg space-y-4 rounded-none border border-gray-200 bg-white p-6"
      >
        <h2 className="text-sm font-medium text-gray-900">
          {editId ? "Edit size" : "Add size"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Width (cm)
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={form.width_cm}
              onChange={(e) => setForm((f) => ({ ...f, width_cm: e.target.value }))}
              className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Height (cm)
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={form.height_cm}
              onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
              className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Label (optional)
          <input
            placeholder="e.g. 60×60 cm"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="mt-1 w-full rounded-none border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-white"
          >
            {editId ? "Save changes" : "Add size"}
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
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Dimensions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{size.label}</td>
                <td className="px-4 py-3 text-gray-500">
                  {size.width_mm} × {size.height_mm} mm
                </td>
                <td className="px-4 py-3">
                  {size.in_use ? (
                    <span className="text-xs text-amber-700">In use</span>
                  ) : (
                    <span className="text-xs text-gray-400">Available</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <button
                    type="button"
                    onClick={() => startEdit(size)}
                    className="me-3 text-xs text-gray-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(size.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sizes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No sizes yet. Add your first tile size above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
