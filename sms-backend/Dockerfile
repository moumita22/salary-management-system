FROM oven/bun:1-alpine
WORKDIR /app

# Set container timezone to Asia/Kolkata (IST)
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy backend source
COPY . .

# Expose default API port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start the Express API server
CMD ["bun", "src/server.ts"]
