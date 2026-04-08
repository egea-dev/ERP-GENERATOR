FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache samba-client

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
