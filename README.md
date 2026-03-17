# 🗳️ Offline-First Campaign CRM (PWA)

A Progressive Web App (PWA) designed for political campaign ground workers. This application features a fully offline-first architecture, allowing field workers to view, edit, and sync voter data even in deep rural areas with zero internet connectivity.

## 🚀 Tech Stack
* **Framework:** [Next.js (App Router)](https://nextjs.org/)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Local Offline Database:** [Dexie.js (IndexedDB)](https://dexie.org/)
* **PWA / Service Workers:** [@serwist/next](https://serwist.pages.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 🛠️ Local Development Setup

### 1. Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v18.x or higher)
* **Git**

### 2. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL_HERE>
cd <YOUR_PROJECT_FOLDER_NAME>
````

### 3\. Install Dependencies

```bash
npm install
```

### 4\. Environment Variables (`.env`)

Create a file named `.env` in the root of the project. **Do not commit this file to GitHub.**

Ask the project owner for the active database credentials and secret keys. Your `.env` should look like this:

```env
# JWT Secret for Auth
JWT_SECRET="<ASK_OWNER_FOR_SECRET>"

# Active PostgreSQL Database URL
DATABASE_URL="<ASK_OWNER_FOR_DATABASE_URL>"
```

### 5\. Generate Prisma Client (⚠️ CRITICAL STEP)

Since we are sharing a live development database, **DO NOT RUN** `npx prisma db push` or `npx prisma migrate dev`. Doing so might alter the database schema for everyone.

Instead, just generate the local TypeScript definitions so your code knows what the database looks like:

```bash
npx prisma generate
```

### 6\. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser to view the application.

-----

## 📱 Testing the Mobile PWA Features

This app is designed specifically for mobile devices. To properly test the UI and the offline Service Worker mechanics on your laptop:

1.  Open the app in **Google Chrome**.
2.  Open **Developer Tools** (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
3.  Click the **Device Toggle Toolbar** icon (`Ctrl+Shift+M` / `Cmd+Option+M`) to switch to Mobile View.
4.  Go to the **Application** tab in DevTools to inspect the Service Worker, Local Storage, and IndexedDB (Dexie) databases.
5.  Go to the **Network** tab and change "No throttling" to **"Offline"** to test the offline editing and Sync Queue functionality\!

-----

## 📂 Key Folder Structure

  * `app/api/` - Backend Next.js API routes (Auth, Sync, Database queries).
  * `app/mobile/` - The mobile-centric UI for field workers.
  * `components/` - Reusable UI components (VoterCard, BottomNav, etc.).
  * `context/` - Global React Contexts (Auth, Theme/Color, Language).
  * `hooks/` - Custom React hooks (e.g., `useOfflineData` for Dexie sync).
  * `lib/` - Configurations for Prisma, Dexie local DB, and Axios.
  * `prisma/` - The database schema.

## 🤝 Contribution Guidelines

If you need to make changes to the database structure (adding new tables or columns):

1.  Update `prisma/schema.prisma`.
2.  Communicate with the team *before* running any migration commands to ensure we don't break the shared database.
