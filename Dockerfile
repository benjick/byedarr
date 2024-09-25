FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV production
CMD ["pnpm", "start"]