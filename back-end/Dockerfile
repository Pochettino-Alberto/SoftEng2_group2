FROM node:18-alpine

WORKDIR /usr/src/app

# makes docker container more stable for compilation dependencies
RUN apk add --no-cache python3 make g++
# Install dependencies
COPY package*.json ./

# Use `npm install` to install dependencies
RUN npm install

# Copy our app into the container
COPY . .
# Compila il TypeScript
RUN npm run build

EXPOSE 3001
#Avvio il backend utilizzando la cartella dist creata dalla build
CMD ["node", "dist/index.js"]
