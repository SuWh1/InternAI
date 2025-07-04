FROM node:18-alpine as builder

WORKDIR /app

# Accept build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE_URL

# Set environment variables for build (Vite requires them during build time)
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy only package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# ❗ Build the app (this creates /app/dist)
RUN npm run build

# 🚀 Production stage
FROM nginx:alpine

# Copy built frontend to nginx's default public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port nginx will run on
EXPOSE 80

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
