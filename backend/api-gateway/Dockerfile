FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Use dynamic port from environment variable
ARG GATEWAY_PORT=8080
ENV GATEWAY_PORT=${GATEWAY_PORT}
EXPOSE ${GATEWAY_PORT}

# Health check uses the dynamic port
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${GATEWAY_PORT}/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
