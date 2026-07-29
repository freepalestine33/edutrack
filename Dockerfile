FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy server code
COPY server ./server
COPY tsconfig.server.json ./

# Build TypeScript
RUN npx tsc --project tsconfig.server.json

# Create directories for receipts and uploads
RUN mkdir -p receipts uploads

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
CMD ["node", "server/index.js"]
