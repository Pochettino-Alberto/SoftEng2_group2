# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# Use `npm install` to install dependencies
RUN npm install
COPY . .

# Allow passing the API base at build time
ARG VITE_API_BASE_URL=http://back-end:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default nginx config with SPA-friendly one
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
