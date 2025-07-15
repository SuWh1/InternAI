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

COPY index.html ./index.html

# Copy the rest of the source code
COPY . .

# ❗ Build the app (this creates /app/dist)
RUN npm run build

# Use a minimal image for the final stage
FROM node:20-alpine

WORKDIR /app

# Copy the built files
COPY --from=builder /app/dist ./dist

# Copy package.json for potential rebuild
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose port (not actually used, just for documentation)
EXPOSE 3000

# Default command
CMD ["echo", "Frontend build container ready"]
