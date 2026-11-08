import make_req from "./requests";
import type { OLBook_Search } from "./types";
export const PAGE_SIZE = 20;
export function buildOLUrl(query: string, page: number, language: string) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(PAGE_SIZE),
    fields: "key,title,author_name,cover_i,first_publish_year",
  });
  if (language) params.set("language", language);
  return `https://openlibrary.org/search.json?${params}`;
}
export function normalizeSearch(data: unknown): OLBook_Search[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("docs" in data) ||
    !Array.isArray(data.docs)
  )
    throw new Error("Invalid search response");
  return data.docs
    .filter(
      (d): d is Record<string, unknown> =>
        d &&
        typeof d === "object" &&
        typeof d.key === "string" &&
        /^\/works\/[A-Za-z0-9]+$/.test(d.key) &&
        typeof d.title === "string",
    )
    .map((d) => ({
      key: d.key as string,
      title: d.title as string,
      author_name: Array.isArray(d.author_name)
        ? d.author_name.filter((a): a is string => typeof a === "string")
        : [],
      cover_i:
        typeof d.cover_i === "number" && d.cover_i > 0 ? d.cover_i : undefined,
      first_publish_year:
        typeof d.first_publish_year === "number"
          ? d.first_publish_year
          : undefined,
    }));
}
export async function searchOnline(
  query: string,
  page: number,
  language: string,
  signal: AbortSignal,
) {
  return normalizeSearch(
    await make_req(buildOLUrl(query, page, language), signal),
  );
}
export async function getCovers(
  key: string,
  signal: AbortSignal,
): Promise<string[]> {
  if (!/^\/works\/[A-Za-z0-9]+$/.test(key)) throw new Error("Invalid work key");
  const data = await make_req(
    `https://openlibrary.org${key}/editions.json?limit=30`,
    signal,
  );
  if (
    !data ||
    typeof data !== "object" ||
    !("entries" in data) ||
    !Array.isArray(data.entries)
  )
    throw new Error("Invalid editions response");
  const ids = new Set<number>();
  for (const edition of data.entries)
    for (const id of Array.isArray(edition?.covers) ? edition.covers : [])
      if (Number.isInteger(id) && id > 0) ids.add(id);
  return [...ids].map(
    (id) => `https://covers.openlibrary.org/b/id/${id}-M.jpg`,
  );
}
