# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS dependencies
WORKDIR /app
ENV NUXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm install --ignore-scripts; fi

FROM dependencies AS build
COPY . .
ARG NUXT_PUBLIC_RELEASE_SHA=development
ENV NUXT_PUBLIC_RELEASE_SHA=$NUXT_PUBLIC_RELEASE_SHA
RUN npm run postinstall && npm run validate && npm test && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1
RUN addgroup -S -g 10001 telnexa && adduser -S -D -H -u 10001 -G telnexa telnexa
COPY --from=build --chown=telnexa:telnexa /app/.output ./.output
USER 10001:10001
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=5 CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
