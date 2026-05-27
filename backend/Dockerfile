FROM node:22-alpine
WORKDIR /app

# Install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy app source
COPY backend/ ./

ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "server.js"]
