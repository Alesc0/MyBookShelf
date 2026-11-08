import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { useBookSearch } from "../hooks/useBookSearch";
import { searchOnline } from "../components/openLibrary";
import { searchBooks } from "../db/books";
jest.mock("../components/openLibrary", () => ({
  PAGE_SIZE: 20,
  searchOnline: jest.fn(),
}));
jest.mock("../db/books", () => ({
  LIBRARY_PAGE_SIZE: 40,
  searchBooks: jest.fn(),
}));
const online = jest.mocked(searchOnline),
  local = jest.mocked(searchBooks);
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
let state: ReturnType<typeof useBookSearch>, root: ReactTestRenderer;
const db = {} as any;
function Harness() {
  state = useBookSearch(db);
  return null;
}
const book = {
  id: 1,
  title: "Local",
  author: "A",
  coverUri: null,
  rating: 4,
  isRead: 1,
  workKey: null,
  editionKey: null,
};
beforeEach(async () => {
  jest.resetAllMocks();
  local.mockResolvedValue([book]);
  await act(async () => {
    root = create(<Harness />);
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
});
test("offline online search does not hide local matches and retry releases loading", async () => {
  online
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce([
      { key: "/works/OL1W", title: "Online", author_name: [] },
    ]);
  await act(async () => state.submit("Local"));
  expect(state.local).toEqual([book]);
  expect(state.error).toBe(true);
  expect(state.loading).toBe(false);
  await act(async () => {
    await state.more();
  });
  expect(state.error).toBe(false);
  expect(state.online).toHaveLength(1);
  expect(state.loadingMore).toBe(false);
});
test("obsolete queries, language changes and leaving search cannot publish stale rows", async () => {
  const old = deferred<any[]>(),
    current = deferred<any[]>();
  online.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  await act(async () => state.submit("Old", "eng"));
  await act(async () => state.submit("New", "por"));
  await act(async () =>
    current.resolve([{ key: "/works/OL2W", title: "New", author_name: [] }]),
  );
  await act(async () =>
    old.resolve([{ key: "/works/OL1W", title: "Old", author_name: [] }]),
  );
  expect(state.online[0].title).toBe("New");
  expect(state.criteria?.language).toBe("por");
  expect(online.mock.calls[0][3].aborted).toBe(true);
  const pending = deferred<any[]>();
  online.mockReturnValueOnce(pending.promise);
  await act(async () => state.submit("Leave"));
  await act(async () => state.reset());
  await act(async () =>
    pending.resolve([{ key: "/works/OL3W", title: "Late", author_name: [] }]),
  );
  expect(state.criteria).toBeNull();
  expect(state.online).toEqual([]);
});
test("failed pagination retains pages, retries the same page, and ignores an old page after a new query", async () => {
  const page = Array.from({ length: 20 }, (_, i) => ({
    key: `/works/OL${i}W`,
    title: String(i),
    author_name: [],
  }));
  online
    .mockResolvedValueOnce(page)
    .mockRejectedValueOnce(new Error("server"))
    .mockResolvedValueOnce([
      { key: "/works/OL99W", title: "Next", author_name: [] },
    ]);
  await act(async () => state.submit("First"));
  await act(async () => {
    await state.more();
  });
  expect(state.online).toHaveLength(20);
  expect(state.loadingMore).toBe(false);
  await act(async () => {
    await state.more();
  });
  expect(online.mock.calls.slice(1).map((args) => args[1])).toEqual([2, 2]);
  expect(state.online).toHaveLength(21);
  const pending = deferred<any[]>();
  online
    .mockResolvedValueOnce(page)
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce([]);
  await act(async () => state.submit("Old"));
  let request!: Promise<void>;
  await act(async () => {
    request = state.more();
  });
  await act(async () => state.submit("Different", "por"));
  await act(async () => {
    pending.resolve(page);
    await request;
  });
  expect(state.online).toEqual([]);
  expect(state.loadingMore).toBe(false);
});
