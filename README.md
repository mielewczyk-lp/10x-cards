# 10x Cards

![Status](https://img.shields.io/badge/status-in_progress-yellow) ![Version](https://img.shields.io/badge/version-0.0.1-blue) ![License](https://img.shields.io/badge/license-TBD-lightgrey)

## Table of Contents

- [1. Project Name](#1-project-name)
- [2. Project Description](#2-project-description)
- [3. Tech Stack](#3-tech-stack)
- [4. Getting Started Locally](#4-getting-started-locally)
- [5. Available Scripts](#5-available-scripts)
- [6. Deployment](#6-deployment)
- [7. Project Scope](#7-project-scope)
- [8. Project Status](#8-project-status)
- [9. License](#9-license)

## 1. Project Name

10x Cards

## 2. Project Description

10x Cards is a web application that helps solo learners transform personal materials into spaced-repetition flashcards within minutes. The MVP focuses on two flashcard creation paths (AI-assisted and manual), an inline review workflow for AI-generated candidates, persistent storage of accepted cards per user, and an integration with an open-source spaced-repetition library. Detailed product requirements are documented in [.ai/prd.md](.ai/prd.md).

## 3. Tech Stack

- **Frameworks**: Astro 5 (site generation) with React 19 for interactive islands.
- **Languages & Tooling**: TypeScript 5, Tailwind CSS 4 (with `@tailwindcss/vite`), Shadcn/ui primitives, clsx/cva for styling utilities.
- **Runtime & Package Manager**: Node.js `22.14.0` (see `.nvmrc`), npm.
- **Backend & Auth**: Supabase (PostgreSQL, Auth, SDK).
- **AI Integration**: OpenRouter.ai for model access (OpenAI, Anthropic, Google, etc.).
- **Testing**: 
  - Unit/Integration: Vitest + Testing Library, MSW (Mock Service Worker) for API mocks.
  - E2E: Playwright for browser automation.
  - Accessibility: Axe/Playwright-a11y for a11y validation.
- **CI/CD & Hosting**: GitHub Actions pipelines deploying to Cloudflare Pages (SSR with `@astrojs/cloudflare`).

Key dependencies and tooling live in `package.json`, including `astro`, `@astrojs/react`, `tailwindcss`, `eslint`, and `prettier`. See [.ai/tech-stack.md](.ai/tech-stack.md) for rationale.

## 4. Getting Started Locally

1. **Prerequisites**
   - Node.js `22.14.0` (install via `nvm install 22.14.0 && nvm use 22.14.0`).
   - npm (bundled with Node 22).
   - Supabase project credentials and OpenRouter API key (to be added to your `.env` when available).
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the development server**
   ```bash
   npm run dev
   ```
4. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## 5. Available Scripts

| Script             | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Start the Astro dev server with hot reload.          |
| `npm run build`    | Produce a production-ready Astro build.              |
| `npm run preview`  | Preview the production build locally.                |
| `npm run astro`    | Run the Astro CLI for custom commands.               |
| `npm run lint`     | Lint the entire project with ESLint.                 |
| `npm run lint:fix` | Lint and auto-fix issues when possible.              |
| `npm run format`   | Format files with Prettier (Astro support included). |

## 6. Deployment

The app deploys automatically to Cloudflare Pages on every push to `main` via GitHub Actions.

### Required GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN` - Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) with **Cloudflare Pages Edit** permissions
- `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare Dashboard URL or sidebar
- `CLOUDFLARE_PROJECT_NAME` - Your Cloudflare Pages project name
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `OPENROUTER_API_KEY` - OpenRouter API key

### Cloudflare Pages Environment Variables

After first deployment, add these in **Cloudflare Dashboard → Pages → Settings → Environment variables**:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`

### Local Testing

```bash
npm run build
npx wrangler pages dev dist
```

## 7. Project Scope

- Desktop and mobile web experience for a single persona.
- AI and manual flashcard authoring, review workflow, Supabase persistence.
- Flashcard CRUD operations with search, pagination, and edit/delete flows.
- Spaced-repetition sessions powered by an external library.
- KPI logging directly in the database—no third-party analytics.

## 8. Project Status

- MVP is in active development (version `0.0.1`).

## 9. License

License terms have not been finalized yet. Until a license file is added, assume all rights reserved by the project owners.
