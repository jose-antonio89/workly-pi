FROM node:24-alpine AS dependencies
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM dependencies AS test
COPY . .
CMD ["npm", "test"]

FROM test AS build
ENV VITE_API_URL=""
RUN npm run build && npm run test:assets

FROM nginx:stable-alpine AS runtime
COPY deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]

# Imagem para Kubernetes (estagio padrao do docker build): sem proxy no Nginx. O navegador chama a API
# direto, pela URL gravada no build pelo Vite. O Compose continua usando o estagio runtime acima.
FROM test AS build-k8s
ARG VITE_API_URL=http://localhost:3000
RUN npm run build && npm run test:assets

FROM nginx:alpine AS k8s
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-k8s /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
