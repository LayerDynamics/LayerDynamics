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

# Copy the whole workspace in one shot. The pnpm workspace globs apps/* and
# packages/*, so every workspace manifest must be present for --frozen-lockfile
# to resolve. A single COPY (rather than per-directory COPYs) avoids a BuildKit
# per-subdir cache-key failure seen on Railway; .dockerignore keeps
# node_modules/dist/.git out of the context.
COPY . .
RUN pnpm install --frozen-lockfile

# Build-time public config. Vite inlines VITE_* at build, so these must be
# present when `vite build` runs. Railway exposes service variables as Docker
# build args automatically; declaring them as ARG + ENV bakes them into the
# static bundle. Both values here are genuinely safe to expose client-side:
#   • VITE_WEB3FORMS_KEY  — a public submission key (designed for client use).
#   • VITE_PORTAL_ORIGIN  — the portal provider's public URL; Discord delivery
#     is proxied through it so the write-capable webhook secret stays server-side
#     and never enters the bundle. (The webhook URL is NOT a build arg anymore.)
#   • VITE_PORTAL_APP     — id of the registered guest app the OtherWork level
#     windows in via PortalShowcase (e.g. `wasmos`). Unset → the showcase is inert.
ARG VITE_WEB3FORMS_KEY
ARG VITE_PORTAL_ORIGIN
ARG VITE_PORTAL_APP
ENV VITE_WEB3FORMS_KEY=$VITE_WEB3FORMS_KEY \
    VITE_PORTAL_ORIGIN=$VITE_PORTAL_ORIGIN \
    VITE_PORTAL_APP=$VITE_PORTAL_APP

# Build the client (tsc -b && vite build -> apps/client/dist).
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
