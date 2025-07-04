FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy and set permissions for entrypoint
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 8000

# Run the application
ENTRYPOINT ["./entrypoint.sh"] 