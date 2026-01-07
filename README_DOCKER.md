# Participium - Docker Deployment Guide
This guide allows you to run the Participium system (Backend + Frontend) on your local machine using Docker.

## Prerequisites
- Docker Desktop installed and running.
- Docker Compose (usually included with Docker Desktop).

## Setup and Running

1. **Create a `.env` file**
   Create a file named `.env` in the same directory as `docker-compose.yml` and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```
   *(Note: A `.env` file with valid credentials may have been provided to you separately)*

2. **Start the application**
   Open a terminal in this directory and run:
   ```bash
   docker compose up -d
   ```
   This command will automatically download the images, create the network and volumes, and start the containers.

3. **Access the application**
   Open http://localhost:5173 in your browser.

## Stopping the application
To stop the containers:
```bash
docker compose stop
```

## Stopping and Removing containers
To stop and remove the containers (data in the volume will persist):
```bash
docker compose down
```

## Remove everything (including data)
To remove containers, networks, and the database volume (WARNING: this deletes all data):
```bash
docker compose down -v
```
