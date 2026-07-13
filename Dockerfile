# syntax=docker/dockerfile:1
# Production image for the Fleetlix marketing site.
# Builds the static Astro site, then serves dist/ with nginx on 4321.
# This is the image that runs on the Mac Mini (Mini-server); the public
# site still deploys to Cloudflare Pages from `main`.
#
# NOTE: this is a static mirror. The /api/register-interest Pages Function
# and the public/_headers CSP are Cloudflare-only and do NOT run here, so
# the interest form won't deliver from this container (see README/CLAUDE.md).

# ── Stage 1: build the static site ──────────────────────────────────────
FROM node:22.13-slim AS build

WORKDIR /app

# Pin pnpm to the version that produced pnpm-lock.yaml.
RUN npm install -g pnpm@11.0.8

# .npmrc + pnpm-workspace.yaml carry the only-built-dependencies allow-list
# for esbuild and sharp — without them the build (sharp image variants) fails.
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── Stage 2: serve the built site ───────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html

# Serve on 4321, resolve Astro's directory-style clean URLs, and set the
# vCard content type so the /card "Add to contacts" button works here too.
COPY <<'NGINX' /etc/nginx/conf.d/default.conf
server {
    listen 4321;
    listen [::]:4321;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Astro emits directory output (e.g. /privacy/index.html).
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    error_page 404 /404.html;

    # Content-hashed assets are safe to cache hard.
    location /_astro/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
    location /fonts/  { add_header Cache-Control "public, max-age=31536000, immutable"; }

    # vCard needs text/vcard so phones open the contact preview.
    location = /fleetlix.vcf {
        types { }
        default_type "text/vcard; charset=utf-8";
    }

    gzip on;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;
}
NGINX

EXPOSE 4321

CMD ["nginx", "-g", "daemon off;"]
