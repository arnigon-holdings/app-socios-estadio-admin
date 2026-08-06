FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 5175

ENV VITE_API_BASE_URL=http://localhost:3001
ENV VITE_FACE_SEARCH_URL=http://localhost:8081
ENV VITE_FACE_SEARCH_TOKEN=dev-face-search-token

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
