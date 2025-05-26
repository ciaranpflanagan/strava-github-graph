# Strava Github Style Graph
The idea behind this project is to create a github style strava activity graph. Uses the strava developer API to pull a users activties (currently only for 2025) and generates a github activity style graph.

## Frontend - React
```console
cd graph && npm run start
```

## Backend - Go
```console
go run main.go
```

## Docker
```console
# Azure login
az login
az acr login --name stravaGithubGraphAcr

# Build & push docker image
docker buildx build --platform linux/amd64 -t stravagithubgraphacr.azurecr.io/strava-github-graph:latest .
docker push stravagithubgraphacr.azurecr.io/strava-github-graph:latest
```