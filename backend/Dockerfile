FROM node:22-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . ./

ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "server.js"]
