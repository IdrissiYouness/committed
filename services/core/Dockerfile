FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libaio1t64 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for libaio (newer Debian uses libaio1t64)
RUN ln -sf /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 || true

# Install PHP extensions
RUN docker-php-ext-install zip pdo

# Install Oracle Instant Client
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    wget https://download.oracle.com/otn_software/linux/instantclient/2112000/instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip && \
    unzip instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip && \
    rm instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip && \
    wget https://download.oracle.com/otn_software/linux/instantclient/2112000/instantclient-sdk-linux.x64-21.12.0.0.0dbru.zip && \
    unzip instantclient-sdk-linux.x64-21.12.0.0.0dbru.zip && \
    rm instantclient-sdk-linux.x64-21.12.0.0.0dbru.zip

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12:$LD_LIBRARY_PATH
ENV ORACLE_HOME=/opt/oracle/instantclient_21_12

# Install OCI8 extension
RUN echo 'instantclient,/opt/oracle/instantclient_21_12' | pecl install oci8-3.3.0 && \
    docker-php-ext-enable oci8

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY composer.json ./

# Install dependencies first (better caching)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy the rest of the application
COPY . .

# Run post-install scripts
RUN composer run-script post-install-cmd --no-interaction || true

EXPOSE 8000
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
