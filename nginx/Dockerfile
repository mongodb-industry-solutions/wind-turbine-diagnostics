# Use the official Nginx image
FROM nginx:alpine

# Install openssl
RUN apk add --no-cache openssl

# Set the working directory
WORKDIR /etc/nginx/certs

# Generate SSL certificate and key
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost"

# Copy the Nginx configuration file
COPY ./default.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]