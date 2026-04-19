FROM node:20.8.1-slim

WORKDIR /app

# Install all deps (incl. dev) first: NODE_ENV=production would skip devDependencies
# and break `next build` (eslint, typescript, prisma CLI, @prisma/client for generate).
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

COPY ./scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]

