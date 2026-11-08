# Architecture and code map

Source code and checked-in configuration are authoritative. MyBookShelf has no backend, accounts, or sync service.

## Startup

`app/_layout.tsx` loads fonts and nests SettingsProvider, GluestackUIProvider, React Navigation ThemeProvider, DrizzleProvider, and the Expo Router Slot. SettingsProvider waits for AsyncStorage hydration before mounting interactive screens. It persists `app_locale` and `app_color_mode`, serializes writes, and exposes storage failures and retry in Settings.

`db/DrizzleProvider.tsx` owns the SQLite connection for its mounted lifetime. It opens `books.db` in an effect, runs migrations, and closes on unmount. Initialization errors have a localized retry. `useDatabase()` supplies the Drizzle database; backup controls use `useDatabaseStore()` for the underlying connection and a screen-remount callback after restoration.

## Routes and components

| File | Responsibility |
| --- | --- |
| `app/index.tsx` | Paged library, local suggestions, search rendering, language chips, focus refresh |
| `hooks/useBookSearch.ts` | Submitted query/language, cancellation, request generation, independent local/online loading, pagination and retry |
| `components/openLibrary.ts` | Encoded URLs, response normalization, edition-cover requests |
| `components/requests.ts` | HTTP status checking, abort propagation, 12-second timeout |
| `app/add-book.tsx` | Scrollable manual entry, native image picker, guarded save |
| `app/book/[id].tsx` | Positive integer IDs, detail loading/retry, serialized rating/read/delete mutations |
| `app/ol-book.tsx` | Online detail, cancellable/retryable cover loading, add to library |
| `app/settings.tsx` | Theme, locale, backup controls, metadata version |

Home refreshes the library and submitted local matches on focus. Library and local search reads use pages of 40 with title/ID ordering. Suggestions cap at eight, cancel pending timers on clear/unmount, and reject obsolete results. SQL LIKE treats `%`, `_`, and backslash as literal query characters. Main list keys use database IDs or Open Library keys. Narrow screens use one column.

Search uses a generation containing submitted criteria and an AbortController. Only that generation may update state. Local matches appear independently of online requests. Failed pages preserve earlier results and retry the same page. Filters remain visible for loading, errors, and empty results. Online results normalize to `OLBook_Search`; `BookItem` explicitly tags local and online rows. BookCard dispatches to LocalBookCard or OLBookCard and reuses BookCardShell.

## Persistence and migrations

`db/schema.ts` defines `books_table` with ID, title, author, coverUri, read flag, rating, and nullable workKey/editionKey. Database checks constrain rating range and read flags. `db/books.ts` trims and validates required strings and integer ratings. It preserves full author strings and work keys when adding online results. Repeated catalog keys are allowed intentionally, so separate copies or editions can coexist. Manual covers copy into persistent document storage before insertion; failed inserts remove that new copy.

`db/migrate.ts` runs pending SQL and ledger updates in one transaction. It baselines only the two originally shipped schemas when no ledger exists. The original migrations remain intact. Migration 0002 rebuilds the table with catalog columns and checks, copies existing data, and supplies NULL for catalog identifiers absent from old schemas. Invalid existing values cause rollback rather than silent data modification. Repeated launches consult `__bookshelf_migrations`.

## Backups

Native exports use SQLite backup into a memory snapshot, then serialize it. The version 1 `.bookshelf` JSON format contains database bytes, device-local cover bytes and original URI mappings, and `settings: false`. Preferences are intentionally excluded. Remote cover URLs remain URLs and still require network access. Missing local cover files cause export to fail explicitly. No cache staging file is left behind.

Import reads and decodes the selected file before touching the live database. It checks SQLite integrity, supported schema/migration versions, database objects, and persisted values, then migrates the staged memory database. Covers write to a unique persistent directory and staged rows get new local URIs. Failure removes that directory. Legacy `.db` imports are accepted, but their nonportable local cover URIs are cleared.

`restoreDatabase` first saves the current library to `books-recovery.db`, then uses SQLite's atomic backup API to publish the staged database into the existing connection. Publication is synchronous, preventing JavaScript operations from interleaving. The provider remounts screens after success, so they reload imported rows without restarting. The recovery copy retains its original cover references; old cover files are not deleted. This avoids deleting/replacing a live database file or mishandling WAL sidecars. The recovery copy is replaced by the next successful recovery snapshot. Both backup controls are disabled during either operation, with a module-level guard against duplicate calls.

## Platform behavior

Native uses image/file/directory pickers. Web disables backup and device-cover selection with translated explanations. `components/alerts.ts` supplies browser dialogs for the supported manual-entry and deletion flows.

Browser SQLite needs SharedArrayBuffer and cross-origin isolation. Metro sets development headers; `public/_headers` supplies a production example for hosts that support that file, including Netlify. Other hosts must configure equivalent COOP `same-origin` and COEP `require-corp` headers. Static export alone does not verify browser database startup. Native picker and filesystem behavior still needs device verification.

NativeWind and Gluestack define semantic colors. UI strings live in both dictionaries. `app.json` owns the displayed app version. Babel inlines SQL migrations; Metro supports SQL and WASM. Native folders are generated rather than checked in.
