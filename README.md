# Qraynix (Runic Journal)

A full-stack personal journal and portfolio platform with a dark, Norse-inspired aesthetic (runes, stone textures, amber glows).

## Tech Stack
* **Backend:** Node.js, Express 5, `better-sqlite3` (WAL mode, FTS5)
* **Frontend (Public):** EJS (Server-rendered), vanilla JS, custom SCSS framework
* **Frontend (Admin):** React 19, Vite, React Router, Context API
* **Editor:** Tiptap v2 (Rich text, slash commands, image upload, code highlighting)

## Features
* **Norse Aesthetic:** Dynamic rune background, scroll animations, glowing text.
* **Entries:** Rich text blogging with tags, cover images, and drafts.
* **Timeline:** Log life events in a chronological interface.
* **Now Page:** A public interface showing what you're currently focused on.
* **Future Page:** Public letters/messages to your future self, including optional time-locked notes.
* **Health Page:** A dedicated public page for personal health updates.
* **Media Library:** Drag-and-drop file manager for images and audio.
* **Analytics:** Visual charts showing writing streaks, word counts, and entry moods.
* **Security:** First-run admin setup (signup locks after first account), rate limiting, Helmet, CSP.
* **Search:** Full-text search (SQLite FTS5) across all journal entries.

## Quick Start
1. `npm install`
2. Configure `.env`:
   ```env
   NODE_ENV=development
   PORT=3000
   SESSION_SECRET=your_super_secret_key_here
   DB_PATH=./data/qraynix.db
   UPLOADS_PATH=./public/uploads
   SITE_URL=http://localhost:3000
   GEMINI_API_KEY=
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Run migrations: `npm run migrate`
4. Build assets (CSS & Admin SPA): `npm run build`
5. Start server: `npm run dev` (for dev) or `npm start` (for production)
6. Go to `http://localhost:3000/login` to create the initial admin account.

## Development Commands
* `npm run dev` - Start Express server with nodemon
* `npm run dev:admin` - Start Vite dev server for the React SPA
* `npm run build:css` - Compile SCSS immediately
* `npm run watch:css` - Watch and compile SCSS on changes
* `npm run create-admin` - Provide an email/password to force-create an admin via CLI

## Architecture
* **`/server/`**: Express backend (routing, middleware, services, DB).
* **`/server/views/`**: EJS templates for the public-facing site.
* **`/client/`**: React SPA for the `/admin` dashboard. Built by Vite.
* **`/public/`**: Static assets (CSS, JS, manifest, uploads).
