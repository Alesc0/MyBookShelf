# Architecture and code map

This guide describes the checked-in implementation. It is a starting point for AI-assisted work, not a feature roadmap. Confirm details in the linked files before editing.

## Startup and providers

`package.json` selects `expo-router/entry`. [app/_layout.tsx](../../app/_layout.tsx) loads fonts and manages the splash screen. Its provider tree is:

```text
SettingsProvider
  GluestackUIProvider, mode from useSettings()
    React Navigation ThemeProvider
      DrizzleProvider
        Expo Router Slot
```

[db/DrizzleProvider.tsx](../../db/DrizzleProvider.tsx) opens `books.db` synchronously at module load, creates the Drizzle database, then runs migrations in an effect. It shows a spinner until success or an error message if migration fails. Screens access the database with `useDatabase()`.

## Routes and UI ownership

| Route/file | Responsibility |
| --- | --- |
| `app/index.tsx` | Library grid, local suggestions, submitted local/online search, online language filter, pagination, pull-to-refresh |
| `app/add-book.tsx` | Manual entry, required trimmed title/author, optional image-library cover |
| `app/book/[id].tsx` | Load a local numeric ID, set/clear rating, toggle read status, confirm deletion |
| `app/ol-book.tsx` | Display metadata passed in route params, fetch alternate edition covers, add a local book |
| `app/settings.tsx` | Theme/language controls and database export/import alerts |
| `app/+html.tsx` | Web static HTML, scroll reset, system-color-scheme body background |
| `app/+not-found.tsx` | Unmatched routes |

[components/SearchBar.tsx](../../components/SearchBar.tsx) handles the input and suggestion interaction. The home route owns query execution and result state. `components/Menu.tsx` opens manual entry through the floating plus button.

The home route renders two-column `FlatList` rows directly. `components/BookGrid.tsx` exists but the home route does not use it. `BookCard` dispatches by the presence of `editions` or `author_name`, then `LocalBookCard` and `OLBookCard` supply props to `BookCardShell`.

## Library data

[db/schema.ts](../../db/schema.ts) defines `books_table` and exports the inferred `Book` type.

| Field | Stored meaning |
| --- | --- |
| `id` | Auto-increment integer primary key |
| `title`, `author` | Required text |
| `coverUri` | Nullable URI string, local or remote |
| `isRead` | Integer, default 0; application uses 0 and 1 |
| `rating` | Integer, default 0; UI uses 0 for unrated and 1 through 5 for stars |

There are no database checks constraining the rating or read flag. [db/books.ts](../../db/books.ts) contains reads, title/author `LIKE` search, insertion, deletion, and updates. Insertion sets unread and unrated defaults explicitly. Search wraps the query in `%`; SQL wildcard characters in user input retain their wildcard meaning. Reads have no explicit sort order. A `users` table with only an integer `id` also exists, but there is no user/account flow.

The two migrations create the tables and add `coverUri`. [drizzle/migrations.js](../../drizzle/migrations.js) imports SQL and the journal. The provider splits SQL at `--> statement-breakpoint`, changes `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS`, and suppresses errors containing `duplicate column name`. It replays all entries at each provider mount without a migration ledger or a transaction around the full sequence. New migrations must account for that behavior.

## Open Library flow

1. Typing triggers local title/author suggestions after a 200 ms debounce.
2. Submitting runs local search and an Open Library request concurrently in `app/index.tsx`.
3. The search URL uses `/search.json`, page size 20, and selected metadata fields. A separate language filter uses Open Library codes such as `eng` and `por`.
4. Pagination appends pages and treats a page shorter than 20 results as the end.
5. `OLBookCard` passes title, formatted author, cover URI, year, and Open Library key to `/ol-book`.
6. The detail route fetches up to 30 editions through `${olKey}/editions.json`, deduplicates positive cover IDs, and builds `covers.openlibrary.org/b/id/<id>-M.jpg` URLs.
7. Adding stores only title, author, and the selected cover URI. It does not persist the Open Library key, year, or full catalog response.

[components/requests.ts](../../components/requests.ts) wraps search `fetch` with a fixed User-Agent and returns parsed JSON. Edition requests use `fetch` directly. Neither path checks HTTP status before decoding. Search has no error recovery or cancellation; a rejected request can leave its loading state active, and an older response can overwrite a newer query. Query encoding currently replaces spaces only. Treat those as existing limits when changing search.

## Settings, styling, and platform configuration

[components/SettingsContext.tsx](../../components/SettingsContext.tsx) stores theme in React state and locale in React state plus AsyncStorage key `app_locale`. [i18n/index.ts](../../i18n/index.ts) starts from the device language, enables fallback, and defaults to English. English and Portuguese dictionaries live beside it. The online search language filter is independent of the UI locale.

NativeWind reads `global.css` through `metro.config.js`; Tailwind configuration and Gluestack's provider configuration define styling. Babel inlines `.sql` imports, resolves root aliases, and includes the Worklets plugin. Metro adds SQL source extensions, WASM assets, and development-server COEP/COOP headers for SharedArrayBuffer. Do not assume those development headers configure a production static host.

`app.json` enables typed routes, the new React Native architecture, Metro web bundling, and static web output. Native project folders are not checked in. There is no application environment-variable template or backend configuration requirement in the current source.

## Backup behavior and known limits

[db/export.ts](../../db/export.ts) copies the document-directory `SQLite/books.db` into cache, asks for an export directory, and writes a timestamped `.db` file. Import picks a file, deletes the destination database file, then writes the selected bytes there. It does not validate the database first or close/reopen the provider's connection. The settings success message asks the user to restart.

An export contains database rows and URI strings. Device-local cover files and AsyncStorage settings are not included. Copying the live database file does not explicitly checkpoint SQLite or collect journal/WAL sidecars. Do not promise a complete portable backup without testing and addressing these limits.

The home library loads on mount and pull-to-refresh, with no focus-triggered reload after returning from another route. Theme starts in light mode each provider mount. The settings screen displays version `1.0.0`, while `package.json` and `app.json` declare `1.0.1`. These are observed implementation details, not requirements to preserve if the user asks to fix them.
