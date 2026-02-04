FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    git \
    libaio1t64 \
    wget \
    unzip \
    gcc \
    python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Oracle Instant Client
RUN mkdir -p /opt/oracle && \
    cd /opt/oracle && \
    wget https://download.oracle.com/otn_software/linux/instantclient/2112000/instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip && \
    unzip instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip && \
    rm instantclient-basiclite-linux.x64-21.12.0.0.0dbru.zip

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12:$LD_LIBRARY_PATH

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
