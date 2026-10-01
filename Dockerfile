# ---- Builder Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Копіюємо файли залежностей
COPY package*.json ./
RUN npm ci

# Копіюємо весь вихідний код
COPY . .

# Компілюємо TypeScript у dist/
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# Копіюємо тільки необхідне з білдера
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Відкриваємо порт (за замовчуванням Express – 5000, змініть якщо потрібно)
EXPOSE 5000

# Запускаємо зібраний бекенд
CMD ["node", "dist/index.js"]



# # ---------- BUILD STAGE ----------
# FROM node:22-slim AS builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY . .
# RUN npm run build

# # ---------- PRODUCTION STAGE ----------
# FROM node:22-slim

# WORKDIR /app

# ENV NODE_ENV=production
# ENV HUSKY=0

# COPY package*.json ./
# RUN npm ci --omit=dev --ignore-scripts

# COPY --from=builder /app/dist ./dist

# EXPOSE 5000

# CMD ["node", "dist/index.js"]