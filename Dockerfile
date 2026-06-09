FROM node:22-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Install git since package.json fetches school-floor-map from GitHub
RUN apk add --no-cache git

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

FROM node:22-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache git

# Copy all code from builder
COPY --from=builder /app /app

EXPOSE 3000

RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]
