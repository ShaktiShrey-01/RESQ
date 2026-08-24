FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev"]