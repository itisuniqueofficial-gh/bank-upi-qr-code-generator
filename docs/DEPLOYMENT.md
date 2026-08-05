# Deploying to Cloudflare Pages

This project is a fully static site (vanilla JS, no build step) and deploys
straight to **Cloudflare Pages**. This guide covers the **manual** deployment
workflows. Choose whichever suits you:

1. [Wrangler CLI](#option-1-wrangler-cli-recommended-for-manual-deploys)
2. [Dashboard direct upload](#option-2-cloudflare-dashboard-direct-upload)
3. [Connect your Git repository](#option-3-connect-your-git-repository-automatic)

## Prerequisites

- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- This repository cloned locally (for Options 1 & 2).
- [Node.js](https://nodejs.org) 18+ only if you use the Wrangler CLI
  (you can also run it via `npx`, no install needed).

> The Cloudflare Pages **project name** used by this repo is
> `bank-upi-qr-code-generator`. After the first deploy you get a production
> URL at `https://<project-name>.pages.dev` — in this case
> `https://bank-upi-qr-code-generator.pages.dev`.

> The repo ships a `404.html`, which Cloudflare Pages serves automatically as
> the custom 404 page — no configuration needed.

---

## Option 1: Wrangler CLI (recommended for manual deploys)

Wrangler is Cloudflare's official CLI. Use it with `npx` (no global install)
or install it globally if you prefer.

```sh
# 1. Log in once (opens your browser to authorize)
npx wrangler login

# 2. Create the Pages project (only the first time)
npx wrangler pages project create bank-upi-qr-code-generator

# 3. Deploy the current directory as a static site
npx wrangler pages deploy . --project-name=bank-upi-qr-code-generator
```

On success, wrangler prints a **preview** URL for this deployment and a
**production** URL once the deploy is marked as production.

### Redeploy after changes

```sh
npx wrangler pages deploy . --project-name=bank-upi-qr-code-generator
```

Only the files that changed are uploaded on subsequent deploys.

### Note on build artifacts

Local dev artifacts (`node_modules/`, the SQLite `database.db*` leftovers,
`.playwright-mcp/`) are excluded from uploads via the `.assetsignore` file at
the repo root, so a plain `wrangler pages deploy .` is safe.

---

## Option 2: Cloudflare Dashboard (direct upload)

No command line needed — upload the folder through the dashboard.

1. Go to <https://dash.cloudflare.com> and sign in.
2. In the sidebar, open **Workers & Pages** → **Create**.
3. Choose **Pages** and select the **Upload assets** (Direct Upload) tab.
4. Set **Project name** to `bank-upi-qr-code-generator`.
5. Drag & drop the project folder (or select it in the file picker) and click
   **Deploy site**.
   - `node_modules/` and other local artifacts are skipped automatically
     thanks to `.assetsignore`.
6. Your production URL is shown once the deploy finishes.

### Redeploy after changes

Repeat step 5 (drag & drop the folder again) — each upload creates a new
deployment.

---

## Option 3: Connect your Git repository (automatic)

If you prefer Cloudflare to build & deploy on every push (an alternative to
the bundled GitHub Actions workflow):

1. In **Workers & Pages** → **Create** → **Pages**, choose the
   **Connect to Git** tab.
2. Authorize GitHub and select this repository.
3. In **Build settings**, since the site has no build step:
   - **Build command**: leave empty
   - **Build output directory**: `/`
4. Set **Production branch** to `main`.
5. Click **Save and Deploy**.

Cloudflare then deploys automatically on every push to `main`.

---

## Custom domain (optional)

1. Open your Pages project → **Custom domains**.
2. Click **Set up a custom domain** and follow the steps to add a domain or
   subdomain already on your Cloudflare account.

## Rollbacks

Cloudflare Pages keeps a deployment history. Open **Workers & Pages** →
your project → **Deployments**, then choose **Rollback to this deployment**
on any previous build.

---

## About the bundled GitHub Actions workflow

The repository includes `.github/workflows/deploy.yml`, which can deploy
automatically from GitHub Actions whenever `main` is updated. You have two
choices:

- **Keep it (auto-deploy):** add the following repository secrets in
  **Settings → Secrets and variables → Actions**:
  - `CLOUDFLARE_API_TOKEN` — an API token with
    `Cloudflare Pages — Edit` permission.
  - `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID (find it on the
    right-hand side of the dashboard overview page).
- **Remove it (manual-only):** delete `.github/workflows/deploy.yml`.
  Otherwise, without the secrets, the workflow will run and fail on every
  push to `main`.
