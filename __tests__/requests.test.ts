/** @jest-environment node */
import make_req from "../components/requests";
import { buildOLUrl, normalizeSearch } from "../components/openLibrary";
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
test("punctuation, accents, and literal plus signs survive URL encoding", () => {
  const query = "Cão & C++ #1";
  const url = new URL(buildOLUrl(query, 2, "por"));
  expect(url.searchParams.get("q")).toBe(query);
  expect(url.searchParams.get("language")).toBe("por");
});
test("HTTP errors reject before JSON decoding", async () => {
  const json = jest.fn();
  jest
    .spyOn(global, "fetch")
    .mockResolvedValue({ ok: false, status: 503, json } as any);
  await expect(make_req("https://example.test")).rejects.toThrow("HTTP 503");
  expect(json).not.toHaveBeenCalled();
});
test("hung request is aborted after the bounded duration", async () => {
  jest.useFakeTimers();
  jest.spyOn(global, "fetch").mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        );
      }),
  );
  const request = expect(make_req("https://example.test")).rejects.toThrow(
    "aborted",
  );
  await jest.advanceTimersByTimeAsync(12000);
  await request;
});
test("normalization rejects malformed responses and filters missing optional metadata", () => {
  expect(() => normalizeSearch({ error: "bad" })).toThrow();
  expect(
    normalizeSearch({
      docs: [
        { key: "/works/OL1W", title: "Book", author_name: ["Full", 5] },
        { title: "No ID" },
      ],
    }),
  ).toEqual([
    {
      key: "/works/OL1W",
      title: "Book",
      author_name: ["Full"],
      cover_i: undefined,
      first_publish_year: undefined,
    },
  ]);
});
