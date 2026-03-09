FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Force cache invalidation
ARG CACHE_BUST
RUN echo "Cache bust: $CACHE_BUST"

COPY . .
RUN rm -rf dist

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY seed-treatments.js ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
