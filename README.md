# Gemini Load Balancer

## Overview

This project is a proxy server for the Google Gemini API. It simplifies API key management, handles key rotation, and provides request logging for your Gemini API interactions.

## Installation

Make sure you have Node.js and bun installed. Then, clone the repository and install the dependencies:

```bash
bun install
```

## Configuration

1.  **Environment Variables**:
    - Create a `.env` file in the project root.
    - You can optionally set the following environment variables:
        - `GEMINI_API_KEYS`:  A comma-separated list of default Gemini API keys.
        - `PORT`:  The port the server will run on (default is 3100).
        - `KEY_ROTATION_REQUEST_COUNT`:  The number of requests before rotating API keys (default is **5**).

2.  **Adding API Keys**:
    - You can add API keys in two ways:
        a. **Using `add-key.js` script**: Run `node add-key.js` and follow the prompts to add your API key.
        b. **Admin API Endpoint**: Use a POST request to `/admin/keys` with the API key in the request body (e.g., `{"key": "YOUR_API_KEY"}`).

## Running the Server

To start the proxy server, use the following command:

```bash
bun run start
```

The server will start running on port 3100 by default. You can change the port by setting the `PORT` environment variable in your `.env` file.

## Usage

The proxy server provides the following endpoints:

-   `POST /v1/chat/completions`:  Proxies requests to the Google Gemini Chat Completions API.
-   `GET /v1/models`: Proxies requests to the Google Gemini Models API.
-   `POST /admin/keys`:  Admin endpoint to add new API keys.

For details on request bodies and responses for the `/v1/chat/completions` and `/v1/models` endpoints, please refer to the official Google Gemini API documentation.

## Running with PM2 (Optional)

For production deployments, you can use PM2 to manage the proxy server process:

```bash
bun install pm2 -g
pm2 start server.js --name gemini-load-balancer