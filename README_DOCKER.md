# Participium - Docker Deployment Guide
This guide allows you to run the Participium system (Backend + Frontend) on your local machine using Docker, without needing to clone the source code (Github repository).

## Prerequisites
Docker Desktop installed and running.
## Installing the images and running the containers

### Quick start
We provide you this bash script to set up the network, volume and start both the backend and frontend containers in just one single command block.

```
docker network create participium-net && \
docker volume create participium-db && \
docker run -d \
  --name participium_BE \
  --network participium-net \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DB_PATH=/usr/src/app/database/database.db \
  -v participium-db:/usr/src/app/database \
  mattiabenevento/participium_backend:latest && \
docker run -d \
  --name participium_FE \
  --network participium-net \
  -p 5173:80 \
  mattiabenevento/participium_frontend:latest && \
```

To run the script on Windows Powershell use:

```
docker network create participium-net; `
docker volume create participium-db; `
docker run -d `
  --name participium_BE `
  --network participium-net `
  -p 3001:3001 `
  -e NODE_ENV=production `
  -e PORT=3001 `
  -e DB_PATH=/usr/src/app/database/database.db `
  -v participium-db:/usr/src/app/database `
  mattiabenevento/participium_backend:latest; `
docker run -d `
  --name participium_FE `
  --network participium-net `
  -p 5173:80 `
  mattiabenevento/participium_frontend:latest; `
```

If you prefer to run commands manually, you can run each of them separately but remember to keep the same order.

Once the containers are running, open http://localhost:5173 in your browser to use the web applications.

## Stopping the application
To stop the application, without deleting the data modification on the database, you can run this command:

```
docker stop participium_FE participium_BE
```

## Restarting the application
If you have previously stopped the containers, do not run the installation commands again. Simply resume them:

```
docker start participium_BE participium_FE
```
Tip: If you get an error saying "No such container", it means they were removed. Follow the Quick Start guide again (your data will still be safe in the volume).

## Remove Containers
This command stops and removes the application containers (safe, data persists):

```
docker rm -f participium_FE participium_BE
```

## Remove everything
Warning: These commands will delete the database volume and permanently erase all the data in the database.

```
docker volume rm participium-db
docker network rm participium-net
```

## Remove images
If you want to free up disk space by removing the downloaded images, you can run:

```
docker rmi mattiabenevento/participium_backend:latest mattiabenevento/participium_frontend:latest
```