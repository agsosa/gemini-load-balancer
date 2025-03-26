# Gemini Load Balancer

A modern NextJS application that serves as a proxy server for the Google Gemini API, with key management, load balancing, and a beautiful UI. This application allows you to efficiently manage multiple Gemini API keys, automatically rotate between them to avoid rate limits, and monitor your API usage with detailed statistics.

![Gemini Load Balancer](https://via.placeholder.com/800x400?text=Gemini+Load+Balancer)

## Features

- **API Key Management**: Add, remove, and monitor your Gemini API keys
- **Load Balancing**: Automatically rotate between multiple API keys to avoid rate limits
- **Usage Statistics**: Monitor your API usage with detailed charts and metrics
- **Logs Viewer**: View and search through request, error, and key event logs
- **API Playground**: Test the Gemini API directly from the UI
- **Dark/Light Mode**: Toggle between dark and light themes
- **Single Command Execution**: Run both frontend and backend with a single command

## Architecture

The Gemini Load Balancer is built using Next.js App Router, which allows for a unified application that handles both the frontend UI and backend API routes. The application follows a modern architecture:

- **Frontend**: React with Chakra UI and Tailwind CSS for a responsive and accessible interface
- **Backend**: Next.js API routes that proxy requests to the Gemini API
- **State Management**: React Context API and SWR for efficient data fetching
- **Data Storage**: File-based storage for API keys and logs
- **Styling**: Chakra UI with Tailwind CSS for a consistent design system

## Installation

Make sure you have Node.js and Bun installed. Then, clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/gemini-load-balancer.git
cd gemini-load-balancer

# Install dependencies
bun install
```

## Configuration

1. **Environment Variables**:
   - Create a `.env` file in the project root (or copy from `.env.example`).
   - Set the following environment variables:
     - `GEMINI_API_KEYS`: A comma-separated list of your Gemini API keys.
     - `PORT`: The port the server will run on (default is 3000).
     - `KEY_ROTATION_REQUEST_COUNT`: The number of requests before rotating API keys (default is 5).

Example `.env` file:
```
GEMINI_API_KEYS=your-api-key-1,your-api-key-2
PORT=3000
KEY_ROTATION_REQUEST_COUNT=5
```

## Running the Application

To start the development server:

```bash
bun run dev
```

The application will be available at http://localhost:3000.

For production deployment:

```bash
# Build the application
bun run build

# Start the production server
bun run start
```

## API Endpoints

The Gemini Load Balancer provides several API endpoints:

### Gemini API Proxy Endpoints

- **POST `/api/v1/chat/completions`**: Proxy for Gemini chat completions API
  - Supports all parameters from the original Gemini API
  - Handles streaming responses
  - Automatically rotates API keys

- **GET `/api/v1/models`**: Proxy for Gemini models API
  - Returns available models from Gemini

### Management API Endpoints

- **GET `/api/admin/keys`**: Get all API keys
- **POST `/api/admin/keys`**: Add a new API key
- **DELETE `/api/admin/keys/:id`**: Delete an API key

- **GET `/api/logs`**: Get logs with filtering options
  - Query parameters:
    - `type`: Type of logs (requests, errors, keys)
    - `limit`: Maximum number of logs to return
    - `startDate`: Filter logs from this date
    - `endDate`: Filter logs until this date
    - `search`: Search term to filter logs

- **GET `/api/stats`**: Get usage statistics
  - Query parameters:
    - `timeRange`: Time range for statistics (24h, 7d, 30d, 90d)

- **GET `/api/settings`**: Get application settings
- **POST `/api/settings`**: Update application settings

## Usage

### Dashboard

The dashboard provides an overview of your Gemini Load Balancer, including:
- Total API keys
- Active keys
- Request statistics
- Error rates

![Dashboard](https://via.placeholder.com/800x400?text=Dashboard)

### API Keys

Manage your Gemini API keys:
- Add new keys
- View key status and usage statistics
- Deactivate or delete keys

![API Keys](https://via.placeholder.com/800x400?text=API+Keys)

### Logs

View and search through logs:
- Request logs
- Error logs
- Key event logs

![Logs](https://via.placeholder.com/800x400?text=Logs)

### API Playground

Test the Gemini API directly from the UI:
- Configure request parameters
- Send requests to the API
- View responses
- Save and load prompts

![API Playground](https://via.placeholder.com/800x400?text=API+Playground)

### Statistics

View detailed usage statistics:
- Request volume over time
- Key usage distribution
- Model usage distribution
- Error rates

![Statistics](https://via.placeholder.com/800x400?text=Statistics)

### Settings

Configure your Gemini Load Balancer:
- Key rotation settings
- Maximum failure count
- Rate limit cooldown
- Log retention
- Theme settings

![Settings](https://via.placeholder.com/800x400?text=Settings)

## Development

### Project Structure

```
gemini-load-balancer/
├── data/                        # Data storage
│   └── keys.json                # API keys storage
├── logs/                        # Log files
├── public/                      # Static assets
├── src/                         # Source code
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes
│   │   │   ├── admin/keys/      # Admin API endpoints
│   │   │   ├── logs/            # Logs API endpoint
│   │   │   ├── settings/        # Settings API endpoint
│   │   │   ├── stats/           # Statistics API endpoint
│   │   │   └── v1/              # Gemini API proxy endpoints
│   │   ├── dashboard/           # Dashboard page
│   │   ├── keys/                # Key management page
│   │   ├── logs/                # Logs viewer page
│   │   ├── playground/          # API playground page
│   │   ├── settings/            # Settings page
│   │   └── stats/               # Statistics page
│   ├── components/              # React components
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom React hooks
│   └── lib/                     # Library code
│       ├── models/              # Data models
│       ├── services/            # Services
│       └── utils/               # Utility functions
```

### Adding Features

To add new features to the Gemini Load Balancer:

1. **Frontend Components**: Add new components in the `src/components` directory
2. **API Routes**: Add new API routes in the `src/app/api` directory
3. **Pages**: Add new pages in the `src/app` directory

### Technology Stack

- **Framework**: Next.js 14+
- **UI Library**: Chakra UI with Tailwind CSS
- **State Management**: React Context API + SWR for data fetching
- **API Communication**: Built-in Next.js API routes + Axios for external calls
- **Charts**: Recharts for usage statistics
- **Package Manager**: Bun
- **Styling**: Chakra UI + Tailwind CSS
- **Icons**: React Icons

## Troubleshooting

### Common Issues

1. **API Keys Not Working**:
   - Ensure your API keys are valid and have access to the Gemini API
   - Check the error logs for specific error messages

2. **Rate Limiting**:
   - If you're experiencing rate limiting, add more API keys to the system
   - Adjust the key rotation settings to rotate keys more frequently

3. **Application Not Starting**:
   - Ensure all dependencies are installed with `bun install`
   - Check that the `.env` file is properly configured

### Logs

The application logs are stored in the `logs` directory:
- `requests-YYYY-MM-DD.log`: Request logs
- `errors-YYYY-MM-DD.log`: Error logs
- `keys-YYYY-MM-DD.log`: Key event logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC