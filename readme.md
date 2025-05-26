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
docker build -t strava-github-graph .
docker run -p 8080:8080 --env-file .env strava-github-graph