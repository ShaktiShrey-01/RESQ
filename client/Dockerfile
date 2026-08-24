# /client/Dockerfile
FROM node:20

WORKDIR /app
COPY package*.json ./

# 🟢 THE FIX: Remove --ignore-scripts so Vite can download its Linux binaries!
RUN npm install

COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]