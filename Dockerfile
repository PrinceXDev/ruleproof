# Single-container deploy: Go API + fixtures serving the statically exported UI.

FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM golang:1.26-alpine AS server
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ cmd/
COPY internal/ internal/
# modernc.org/sqlite is pure Go, so no cgo toolchain is needed.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /ruleproof-server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=server /ruleproof-server /app/ruleproof-server
COPY --from=web /web/out /app/web
ENV RULEPROOF_WEB_DIR=/app/web \
    RULEPROOF_DB_PATH=/tmp/ruleproof.db \
    PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/ruleproof-server"]
