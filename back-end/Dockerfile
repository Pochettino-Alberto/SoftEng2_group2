FROM node:18-alpine

WORKDIR /usr/src/app

# makes docker container more stable for compilation dependencies
RUN apk add --no-cache python3 make g++
# Install dependencies
COPY back-end/package*.json ./

# Use `npm install` to install dependencies
RUN npm install

# Copy our app into the container
COPY back-end/ .
# Compila il TypeScript
RUN npm run build

# ensure that when a third user uses our docker images, he will be able to automatically build the database and initialize it 
# the first time he uses it
RUN mkdir -p database
COPY database/tables_DDL.sql ./database/
COPY database/tables_default_values.sql ./database/
# Also copy SQL files to a separate folder so they remain available when a volume
# is mounted on `/usr/src/app/database` (mount hides files copied into image).
RUN mkdir -p sql
COPY database/tables_DDL.sql ./sql/
COPY database/tables_default_values.sql ./sql/

EXPOSE 3001
#Avvio il backend utilizzando la cartella dist creata dalla build
CMD ["node", "dist/index.js"]
