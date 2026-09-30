# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN npm install --global pnpm@10.4.1

# Install from the lockfile before copying the rest of the source.
# This keeps local node_modules out of the dependency layer.
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# --- ADICIONE ESTAS LINHAS AQUI ---
# --- ADICIONE ESTAS LINHAS AQUI ---
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
# ----------------------------------

RUN pnpm build
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN npm install --global pnpm@10.4.1

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["pnpm", "start"]
