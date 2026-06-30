# Use a Node image that supports Node.js 24+ (built-in SQLite module support)
FROM node:24-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install production and development dependencies (needed for compiling React and esbuild)
RUN npm ci --include=dev

# Copy all source files
COPY . .

# Compile the React frontend and esbuild server
RUN npm run build

# Expose default port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start server from compiled production bundle
CMD ["node", "dist/server.cjs"]
