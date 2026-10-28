FROM node:20-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json ./
RUN npm install --registry=https://registry.npmmirror.com --no-audit

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
