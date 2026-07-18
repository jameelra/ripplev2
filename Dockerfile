FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Railway only exposes service Variables to a Docker build if they're
# declared as ARGs here — otherwise import.meta.env.VITE_* is undefined
# in the built bundle, since Vite bakes these in at build time, not runtime.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]

