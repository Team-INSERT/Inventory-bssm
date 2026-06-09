FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install python, native build tools, and git for better-sqlite3 and git-hosted packages
RUN apk add --no-cache python3 make g++ git

# Copy workspaces manifests and locks
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build Next.js application
RUN pnpm build

# ── Runner Stage ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Install python, build tools, and git for better-sqlite3 production install
RUN apk add --no-cache python3 make g++ git

# Copy package manifests and locks
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy build artifacts and assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENV PORT=3000

CMD ["pnpm", "start"]
