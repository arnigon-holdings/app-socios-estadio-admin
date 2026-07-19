FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm run postinstall || true

COPY . .

EXPOSE 5175

ENV VITE_API_BASE_URL=http://localhost:3001
ENV VITE_FACE_SEARCH_URL=http://localhost:8081
ENV VITE_FACE_SEARCH_TOKEN=dev-face-search-token

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
