FROM node:22

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173 8080

CMD ["sh", "-c", "npm run dev & node src/Backend_App.js"]