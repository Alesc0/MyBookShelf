# Working in MyBookShelf

These instructions apply to the whole repository. Read [the architecture guide](docs/ai/architecture.md) before changing a feature, and use [the development guide](docs/ai/development.md) for commands and verification.

## Project scope

MyBookShelf is a personal library app built with Expo SDK 55, React Native 0.83.2, React 19.2, and TypeScript. Expo Router owns navigation. Books live in an on-device SQLite database accessed through Drizzle. Open Library supplies search results and cover URLs. There is no application backend, account system, or sync service in this repo.

## Start here

- Inspect `git status --short` and preserve existing user changes.
- Treat source code and checked-in configuration as the authority. Recheck these docs when the implementation changes.
- Use Bun and preserve `bun.lock`. Do not introduce another package manager's lockfile.
- Keep changes within the requested feature. Avoid reformatting unrelated files or changing dependencies as incidental cleanup.
- Read the relevant route and its database/component dependencies before editing. Search is in `app/index.tsx`; there is no `app/search.tsx`.

## Code conventions

- Use TypeScript and function components. The project enables strict type checking and resolves `@/` to the repository root.
- Keep database operations in `db/books.ts` and obtain the database through `useDatabase()`. Derive persisted book types from `db/schema.ts`.
- Use the existing Gluestack primitives in `components/ui/` and NativeWind classes. Prefer semantic colors such as `bg-background-300` and `text-typography-600` for UI that must follow the selected theme.
- Reuse `BookCardShell`, `LocalBookCard`, and `OLBookCard` for book presentation. Local book rows and Open Library results have different shapes.
- Add user-facing strings to both `i18n/en.json` and `i18n/pt.json`, with matching keys and interpolation variables. Use `i18n.t(...)` in components.
- Settings come from `useSettings()`. Locale persists under `app_locale`; color mode currently resets to light when the provider mounts. Do not describe theme persistence as implemented.
- Respect native and web differences. A successful web bundle does not verify SQLite startup, image pickers, file pickers, or native navigation.

## Data changes need special care

- Preserve existing libraries. Never delete a database or remove old migrations to make a change pass.
- Schema changes require Drizzle migration generation and review of SQL, snapshots, journal, and `drizzle/migrations.js` together. See the development guide.
- The custom migration runner replays every journal entry on startup. It rewrites `CREATE TABLE` and ignores duplicate-column errors, but has no applied-migration ledger. Check repeat launches and upgrades with existing data, especially for data-changing SQL.
- Export/import copies the SQLite file and stores cover URIs as text. It does not package image files or settings. Imports replace the database and require an app restart. Use disposable data to verify this flow.

## Before handing off

- Run checks appropriate to the change using the development guide. Do not claim tests, native builds, or device checks passed unless you ran them.
- No test files are checked in. Jest is configured, and `bun run test` starts watch mode. Use an explicit one-shot command for automation and report a missing test suite honestly.
- Keep these docs current when changing routes, persistence, commands, provider wiring, or build behavior.
- Summarize the behavior changed, checks run, and remaining limitations. Do not commit generated builds, credentials, or personal library files.
