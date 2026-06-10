FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -la
EXPOSE 3000
CMD ["sh", "-c", "echo 'starting node' && node index.js"]