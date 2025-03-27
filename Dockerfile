# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Ensure the logs directory exists (good practice even with volume mount)
RUN mkdir -p logs

# Expose the port the app runs on
EXPOSE 3000

# Set the command to run the development server
CMD ["npm", "run", "dev"]
