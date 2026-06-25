# Production image for the LILETTI admin dashboard (Next.js 15)
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
# Prisma schema is needed for the postinstall `prisma generate`.
COPY prisma ./prisma
RUN npm ci

COPY . .

# NEXT_PUBLIC_* must be present at build time (Next inlines them, and
# next.config reads NEXT_PUBLIC_S3_PUBLIC_URL for image remotePatterns).
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG NEXT_PUBLIC_S3_PUBLIC_URL
ARG BETTER_AUTH_SECRET
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
    NEXT_PUBLIC_S3_PUBLIC_URL=$NEXT_PUBLIC_S3_PUBLIC_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
