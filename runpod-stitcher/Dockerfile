FROM python:3.11-slim

# Install ffmpeg and AWS CLI (for S3/R2 access)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    awscli \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install boto3 requests runpod

# Copy handler script
COPY handler.py /handler.py

# Set working directory
WORKDIR /

# Run handler
CMD ["python", "/handler.py"]

