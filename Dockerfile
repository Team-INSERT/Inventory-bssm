# ── 1. Build Stage ──
FROM node:22-slim AS builder
WORKDIR /app

# Set build-time dummy URL to bypass Prisma configuration validation
ENV DATABASE_URL="file:./prisma/dev.db"

# Install pnpm
RUN npm install -g pnpm

# Install python, native build tools, git, and openssl for better-sqlite3 and Prisma
RUN apt-get update && apt-get install -y python3 make g++ git openssl && rm -rf /var/lib/apt/lists/*

# Copy workspaces manifests and locks
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN DATABASE_URL="file:./prisma/dev.db" pnpm exec prisma generate

# Build Next.js application
RUN DATABASE_URL="file:./prisma/dev.db" pnpm build

# Prune node_modules to keep only production dependencies
RUN pnpm prune --prod

# ── 2. Runner Stage ──
FROM node:22-slim AS runner
WORKDIR /app

# Install openssl required by Prisma client runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV DATABASE_URL="file:./prisma/dev.db"
ENV NODE_ENV=production

# Copy built artifacts and pruned node_modules from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

ENV PORT=3000

# Start Next.js using standard npm start (pnpm is not required in runner stage)
CMD ["sh", "-c", "npx prisma db push && npm start"]
