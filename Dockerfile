# Production image: docker build -t milandhoo-market .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
# Standalone server plus what's needed to run migrations and seeding on start.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
RUN mkdir -p uploads
EXPOSE 3000
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts && node server.js"]
