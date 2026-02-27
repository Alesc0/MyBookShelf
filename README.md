# MyBookShelf

A personal book library app built with React Native and Expo. Search the Open Library catalog, add books to your collection, rate them, and track your reading progress.

## Features

- **Personal Library** — Add books manually or from Open Library search results
- **Open Library Search** — Search millions of books via the [Open Library API](https://openlibrary.org/) with infinite scrolling
- **Star Ratings** — Rate books from 1 to 5 stars
- **Reading Tracker** — Mark books as read/unread
- **Cover Images** — Pick cover images from your device gallery
- **Export / Import** — Back up your library to a file and restore it on another device
- **Internationalization** — English and Portuguese (auto-detects device language, persists choice)
- **Dark Mode** — Toggle between light and dark themes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo SDK 55](https://expo.dev/) / React Native 0.83 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Database | [Drizzle ORM](https://orm.drizzle.team/) + [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| UI Components | [Gluestack UI](https://gluestack.io/) |
| Styling | [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for RN) |
| i18n | [i18n-js](https://github.com/fnando/i18n-js) + expo-localization |
| Icons | [Lucide](https://lucide.dev/) |
| Storage | AsyncStorage (settings), expo-file-system (export/import) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/) (package manager)
- [Expo Go](https://expo.dev/go) on your device/emulator

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Alesc0/MyBookShelf.git
cd MyBookShelf

# Install dependencies
bun install

# Start the dev server
bun expo start
```

Scan the QR code with Expo Go or press `a` for Android / `i` for iOS.

## Project Structure

```
app/                  # Expo Router pages
  _layout.tsx         # Root layout (providers)
  index.tsx           # Home — book grid
  search.tsx          # Search with infinite scroll
  add-book.tsx        # Manual book entry form
  settings.tsx        # Settings (theme, language, data)
  book/[id].tsx       # Local book detail
  ol-book.tsx         # Open Library book detail
components/           # Reusable components
  ui/                 # Gluestack UI primitives
  BookCard.tsx        # Book card dispatcher
  BookGrid.tsx        # Grid layout for books
  SearchBar.tsx       # Search input with navigation
  SettingsContext.tsx  # App settings provider
db/                   # Database layer
  schema.ts           # Drizzle table definitions
  books.ts            # CRUD operations
  export.ts           # Export/import database
  DrizzleProvider.tsx  # DB + migration provider
i18n/                 # Translations
  en.json             # English
  pt.json             # Portuguese
```

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `title` | TEXT | Book title (required) |
| `author` | TEXT | Author name (required) |
| `coverUri` | TEXT | Local URI to cover image |
| `isRead` | INTEGER | 0 = unread, 1 = read |
| `rating` | INTEGER | 0–5 star rating |

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/main.yml`) that builds an unsigned iOS IPA on demand via `workflow_dispatch`.

## License

MIT
