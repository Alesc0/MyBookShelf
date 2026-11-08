# Development and verification

Read [AGENTS.md](../../AGENTS.md) for repository instructions and [architecture.md](architecture.md) for feature ownership and data behavior.

## Local setup

Use Bun as the package manager and a Node.js runtime compatible with the Expo version declared in `package.json`. Neither runtime has a repository version pin. `bun.lock` is the dependency lockfile; `.npmrc` contains `legacy-peer-deps=true` for npm compatibility.

```sh
bun install --frozen-lockfile
bun run start
```

Use an Expo-compatible device client or emulator for native checks. iOS simulator and Xcode builds require macOS. Go Task is optional; `Taskfile.yml` wraps the commands below. No application secrets are required for the current library and public Open Library flows.

## Commands from the repository root

| Purpose | Command | Notes |
| --- | --- | --- |
| Start Expo | `bun run start` | Interactive development server |
| Start Android / iOS | `bun run android` / `bun run ios` | Starts Expo for the selected platform |
| Start web | `bun run web` | Metro development server |
| Export web | `bun run build` | Writes ignored `dist/`; `build:preview` is identical |
| Check TypeScript | `bunx tsc --noEmit` | Also `task lint`; no separate ESLint configuration/script |
| Watch tests | `bun run test` | Jest with `jest-expo` preset |
| Run tests once | `bunx jest --watch=false --runInBand` | No tests are currently checked in; do not hide this with `--passWithNoTests` |
| Generate migrations | `bunx drizzle-kit generate` | Also `task db:generate`; writes files under `drizzle/` |
| Open Drizzle Studio | `bunx drizzle-kit studio` | Also `task db:studio`; inspect Expo driver requirements before relying on it for device data |

There is no `bun run lint`, `bun run typecheck`, or `bun run test:ci` script. `task test:ci` calls `bunx jest`. Use package scripts or direct commands if Go Task is unavailable. Do not use Bun's built-in test runner as a substitute for the configured Jest suite.

## Choose verification for the change

For documentation-only changes, check local Markdown links, command names, source claims, and `git diff --check`. Installing app dependencies or running a native build is unnecessary.

For TypeScript or UI changes, run type checking and exercise the affected flow. For Metro, Babel, styling configuration, or web changes, also try `bun run build`. A successful static export verifies bundling, not the app's runtime behavior. For new tests, use Jest with Expo-aware mocks and run it once without watch mode.

If a command fails on the unmodified project, record the error separately from errors introduced by the change. Report missing tools and skipped device checks explicitly. Do not change dependencies merely to make an unrelated check green.

## Changing the schema

1. Read `db/schema.ts`, `db/books.ts`, `db/DrizzleProvider.tsx`, and existing `drizzle/` files.
2. Update schema and database operations together.
3. Run `bunx drizzle-kit generate`.
4. Review generated SQL, metadata snapshots, `_journal.json`, and `drizzle/migrations.js`. Confirm that the new SQL import and `mNNNN` map entry match the journal index. Preserve existing migrations.
5. Check Babel's SQL inlining and Metro bundling if migration loading changed.
6. Test a fresh database and an upgrade with existing rows. Restart again to test replay. Verify retained titles, covers, ratings, and read flags.

The runner does not track completed migrations. Data-changing or destructive statements may repeat at every launch, and failures may leave earlier statements applied. Resolve that risk as part of a schema change rather than assuming standard Drizzle migration tracking exists.

## Manual checks by feature

Use a disposable library for changes involving import, deletion, or migrations. These checks are a checklist for future work, not a claim that they have already passed.

| Area | What to exercise |
| --- | --- |
| Startup | Fresh install and repeat launch; migration spinner clears; routes render |
| Manual entry | Empty title/author validation, whitespace trimming, cover selection/cancellation, save, back navigation, pull-to-refresh |
| Local detail | Existing/missing ID, read/unread, each star value, tap selected rating to clear, cancel/confirm delete |
| Search | Local suggestions, submit, local and online sections, collapse/expand, next page, language filter, clear/back, no results |
| Network changes | Offline/rejected requests, rapid consecutive queries, absent authors/covers, no duplicate pagination requests |
| Online detail | Alternate covers, no editions/covers, selected cover retained when adding, local row after refresh |
| Settings | Both languages, matching translations, light/dark controls, locale after restart, theme reset behavior |
| Backup | Export and cancel; import and cancel; confirm replacement on disposable data; restart and verify rows; check local cover availability separately |
| Web | Library/SQLite startup in browser, route navigation, layout, console errors, production hosting headers |
| Native | Keyboard/safe area, navigation, image permission/picker, file/directory pickers on the platform affected |

## Builds and CI

[.github/workflows/main.yml](../../.github/workflows/main.yml) runs on manual dispatch and pushes to `main`. On `macos-15` it installs with Bun's frozen lockfile, runs a clean iOS prebuild and CocoaPods, archives with signing disabled, and uploads an unsigned IPA. It does not run TypeScript checks or Jest. An uploaded IPA is not evidence that automated tests passed or that App Store distribution is configured.

`eas.json` defines development, preview, and production build profiles and a production submit entry. Treat submitting or publishing as a separate action from local verification. A clean Expo prebuild regenerates native projects; review local native changes before running it.

## Keeping AI context useful

When changing behavior, update the relevant section here or in the architecture guide with concrete file references. Keep durable instructions in `AGENTS.md`; put detailed implementation context in `docs/ai/`. Distinguish observed limitations from intended behavior and avoid recording unverified fixes as facts.
