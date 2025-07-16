FROM node:20-alpine as builder

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

# Copy the entire source code (including index.html)
COPY . .

# Build the app (this creates /app/dist)
RUN npm run build

# Use a minimal nginx image for serving
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
