FROM node:20-alpine AS base 

# Base image for all subsequent stages

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm ci

FROM base AS builder
WORKDIR /app

# Adding build argument for MongoDB URI
ARG MONGODB_URI

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Adding MONGODB_URI environment variable for the build phase
ENV MONGODB_URI=$MONGODB_URI

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

ENV MONGODB_URI=$MONGODB_URI

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]