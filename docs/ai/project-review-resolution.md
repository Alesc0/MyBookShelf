# Project review resolution

This change addresses the findings in the user's 2026-11-08 project review. The original review file remains a local user document.

| Finding | Implementation and evidence |
| --- | --- |
| 1. Unsafe import | Decode and validate before publication, atomic SQLite backup, recovery snapshot, guarded controls, screen remount. SQLite browser reproduction and import failure-injection tests. |
| 2. Migration replay | Transactional ledger with explicit historical baselines. Real SQLite tests for fresh install, both shipped schemas, repeat launch, failure/rollback, and once-only data changes. |
| 3. Search failures | Independent local results, HTTP checks, timeout, retries, finally cleanup, shared cover request handling. Request/hook tests and offline browser flow. |
| 4. Request races | Submitted criteria and cancellable generations. Hook tests resolve old queries and pages after newer searches or exit. |
| 5. Portable backup | Memory snapshot, versioned database/cover bundle, persistent picked images, settings explicitly excluded, missing-image failure. Backup tests and SQLite snapshot reproduction. |
| 6. Stale cards | Focus refresh for library and submitted local matches. Browser add/read/rating flow returns home without refresh. |
| 7. Encoding/filter visibility | URLSearchParams and always-visible search filters. Encoding tests and offline browser language switching. |
| 8. Suggestions | Timer cleanup, generation checks, eight-row limit, scrollable dropdown. Database limit test and source review. |
| 9. Database failures/mutations | Localized errors/retries, positive IDs, guarded writes, finally cleanup, existing detail retained after write failure. SQL/hook tests and browser mutation flow. |
| 10. Verification/CI | PR type/test/web checks, frozen Bun, pinned runtimes, focused Jest suites. Aligned the test renderer to React 19.2 and fixed existing type errors needed by CI. |
| 11. Accessibility/layout | Translated control names and star labels, selected/expanded states, decorative cover images hidden, scrollable form, responsive covers/grid. Browser checks at 360px; native assistive technology remains unverified. |
| 12. Theme/locale/version | Hydrated persistent preferences, serialized writes and visible errors, semantic control colors, translated catalog languages, app metadata version. Preference tests and Portuguese/dark browser restart. |
| 13. Persisted identity/values | Work/edition columns, full authors, explicit allow-multiple-copies policy, central validation and database checks. Generated/reviewed migration, retained-row tests, literal search/data validation tests. |
| 14. Bounded reads/keys | Title/ID ordering, pages of 40, eight suggestions, stable database/catalog keys, literal SQL wildcards. SQL regression with 85 seeded rows. No full-text search added. |
| 15. Search separation/platforms | Dedicated search hook and normalized Open Library client, explicit tagged card input, production isolation headers, native-only backup/picker states and web alerts. Browser SQLite startup tested. |

## Runtime issues found while verifying

Opening SQLite asynchronously warms the web worker before the synchronous Drizzle driver runs. A one-line Bun patch to Expo SQLite writes the response byte length as a full 32-bit integer. The original implementation truncated lengths above 255 bytes. A regression test covers this boundary. Keep the patch while using this Expo SQLite version and recheck it before updating the package.

The backup implementation retains the provider's connection and publishes through SQLite's backup API. It avoids replacing an open database file. This is a deliberate alternative to closing, swapping files, and reopening a connection.

## Limits

Verification uses Node SQLite, Jest with Expo-aware mocks, and Chromium against a production export served with COOP/COEP headers. SQLite validation/publication, a retained recovery copy, snapshot serialization after recent WAL writes, and migration replay were exercised through Expo SQLite in the browser using a temporary verification route. That route is removed from the submitted source.

No Android/iOS device, native file picker, gallery picker, VoiceOver, or TalkBack was available in this session. Native filesystem and cross-device cover mapping are tested with failure-injection mocks. A real device restore using disposable data remains the release check for these platform boundaries. Recovery snapshots retain local file references, so old cover files are deliberately retained. Backups use JSON byte arrays and may be large for image-heavy libraries.
