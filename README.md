# Neural Cortex

Neural Cortex is a React 19 + Vite productivity workspace for habits, tasks, notes, and performance analytics. It uses Firebase Authentication, Firestore, and Storage with local Firestore persistence enabled for multi-tab use.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS v4
- Firebase Auth, Firestore, Storage
- TipTap for rich notes
- dnd-kit for task and note ordering
- i18next for translations

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Local Development

Install dependencies, then run the Vite dev server:

```bash
npm install
npm run dev
```

The Firebase web config is currently defined in `src/firebase.ts`. In production, the auth domain is derived from the current hostname so hosted deployments can use first-party auth cookies.

## Firebase Data Model

Firestore collections are intentionally stable:

- `users`: profile, theme, onboarding state, and note preferences
- `habits`: user-owned habit definitions
- `habit_logs`: user-owned daily habit completions
- `tasks`: user-owned task cards with subtasks and ordering
- `notes`: user-owned rich-text notes
- `folders`: user-owned note folders

All user content documents include `userId`. Client writes verify ownership before update/delete, and Firestore rules also require authenticated ownership.

Storage uploads must use user-scoped paths:

```text
users/{uid}/images/{filename}
users/{uid}/covers/{filename}
```

Firebase Storage rules should mirror that convention and only allow a signed-in user to read/write under their own `users/{uid}` prefix.

## Backup And Import

Settings exports a schema-versioned JSON backup with:

- `schema_version: 3`
- `nexus_habits`
- `nexus_logs`
- `nexus_tasks`
- `nexus_notes`
- `nexus_folders`
- `nexus_preferences`

Imports validate the backup shape before writing and replace record ownership with the current signed-in user.

## Deployment

The repo includes deployment config for Firebase Hosting, Netlify, and Vercel. Build before deploying:

```bash
npm run lint
npm run build
```

The production build uses route-level lazy loading and manual chunks for Firebase, TipTap, dnd-kit, and Framer Motion to keep the initial app shell lighter.
