FROM node:22-slim

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 2000

CMD ["npm", "start"]