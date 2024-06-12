# Use the official Python image as a base
FROM python:3.9-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y wget ffmpeg

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt &&\ 
    python -c "from panns_inference import AudioTagging; model = AudioTagging(checkpoint_path=None, device='cpu')"

# Copy the rest of the application code to the container
COPY . .

# Expose the port the FastAPI application runs on
EXPOSE 8000

# Run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
