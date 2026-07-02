import { apiFetch, type Brand } from "@/lib/api";

export async function getBrands(locale: string): Promise<Brand[]> {
  try {
    const data = await apiFetch<{ items: Brand[] }>("/api/v1/public/brands", {
      locale,
      next: { revalidate: 60 },
    });
    return data.items;
  } catch {
    return [];
  }
}
