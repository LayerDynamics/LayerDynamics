# syntax=docker/dockerfile:1
#
# Production image for the LayerDynamics 3D portfolio (apps/client).
# Multi-stage: build the Vite app with pnpm, then serve the static dist with a
# tiny SPA-aware static server. Used by Railway (see railway.toml). Replaces the
# Nixpacks build, which couldn't put pnpm on PATH for this no-root-deps monorepo.

# ---- build stage ----------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

# Enable Corepack so the pnpm version pinned in package.json#packageManager
# (pnpm@10.32.1, matching the committed lockfile) is the one that runs.
RUN corepack enable

# Install deps first (cached unless a manifest or the lockfile changes). The
# pnpm workspace globs apps/* and packages/*, so every workspace manifest must
# be present for --frozen-lockfile to resolve.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

# Build the client (tsc -b && vite build -> apps/client/dist).
COPY . .
RUN pnpm --filter client build

# ---- runtime stage --------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# `serve -s` serves a single-page app: any unmatched route falls back to
# index.html, which is what react-router's browser history needs for
# /projects/:id deep links. No Host-header allow-list needed (unlike vite preview).
RUN npm install -g serve@14

COPY --from=build /app/apps/client/dist ./dist

# Railway injects $PORT; default to 8080 for local `docker run`.
EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
