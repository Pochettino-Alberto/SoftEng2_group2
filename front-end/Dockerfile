# Build stage
FROM node:18-alpine AS build
WORKDIR /app
# copy the dependencies
COPY front-end/package*.json ./
# Use `npm install` to install dependencies
RUN npm install
#copy the source code
COPY front-end/ .
#compile -> this will create the dist directory
RUN npm run build

# Production stage
FROM nginx:alpine
# clean the nginx public directory
RUN rm -rf /usr/share/nginx/html/*
#copy the compiled files (dist dir) from stage build into the nginx public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default nginx config with a custom one that makes React Router work as expected
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
# Start Nginx, but pass the global option (-g) to tell it not to run in the background (daemon off).
# Stay here in the foreground so Docker knows you're still alive.
CMD ["nginx", "-g", "daemon off;"]
