FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
# Use `npm install` to install dependencies
RUN npm install

# Copy source and build
COPY . .
RUN npx tsc

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
