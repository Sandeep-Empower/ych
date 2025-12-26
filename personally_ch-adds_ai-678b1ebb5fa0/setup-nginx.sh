#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Detect OS
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y nginx
elif [ -f /etc/redhat-release ]; then
    # RHEL/CentOS
    yum install -y epel-release
    yum install -y nginx
elif [ -f /etc/arch-release ]; then
    # Arch Linux
    pacman -S nginx
else
    echo "Unsupported operating system"
    exit 1
fi

# Create nginx configuration directory
mkdir -p /etc/nginx/sites-enabled

# Create main nginx configuration
cat > /etc/nginx/nginx.conf << 'EOL'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Dynamic server blocks will be added here
    include /etc/nginx/sites-enabled/*.conf;
}
EOL

# Set proper permissions
chown -R root:root /etc/nginx
chmod -R 755 /etc/nginx

# Start nginx
systemctl enable nginx
systemctl start nginx

echo "Nginx has been installed and configured successfully!"
echo "You can now create sites using the application." 