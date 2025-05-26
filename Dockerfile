# Build stage for Go
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
# Install Node.js and npm for building the React app
RUN apk add --no-cache nodejs npm
RUN cd graph && npm install && npm run build
RUN go mod download
RUN go build -o server main.go

# Final stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/graph/build ./graph/build
COPY --from=builder /app/graph/public ./graph/public
COPY --from=builder /app/.env .env
EXPOSE 8080
CMD ["./server"]