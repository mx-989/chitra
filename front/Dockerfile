# front/Dockerfile
FROM nginx:alpine

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Le volume sera monté, donc pas besoin de copier les fichiers

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]