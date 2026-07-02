import { apiFetch, type DesignType } from "@/lib/api";

export async function getTileTypes(locale: string): Promise<DesignType[]> {
  try {
    const data = await apiFetch<{ items: DesignType[] }>(
      "/api/v1/public/types",
      { locale, next: { revalidate: 60 } },
    );
    return data.items;
  } catch {
    return [];
  }
}
