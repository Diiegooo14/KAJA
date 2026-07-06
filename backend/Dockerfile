FROM php:8.2-cli

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app
COPY . .

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8080} router.php"]
