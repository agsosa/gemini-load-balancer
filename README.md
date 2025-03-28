# Gemini Load Balancer

A modern NextJS application that serves as a proxy server for the Google Gemini API, with key management, load balancing, and a beautiful UI. This application allows you to efficiently manage multiple Gemini API keys, automatically rotate between them to avoid rate limits, and monitor your API usage with detailed statistics.


![Gemini Load Balancer](https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%3Fid%3DOIP.8qJFfRHJ4w1imQm4ATTdcAHaFl%26pid%3DApi&f=1&ipt=967751466c9cf44b0aa649a4db4edd75c0fba31eeac5b92c314a7c161ab215a1&ipo=images)

Thanks to @SannidhyaSah for his contribution in this application 

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

The application requires minimal configuration:

1. Create a `.env` file in the project root (or copy from `.env.example`)
2. Set only the PORT number (default is 4269). Example `.env` file:
```
PORT=4269
```

Note: API keys and other settings are managed through the UI and stored in the data folder.

## Running the Application

To start the development server:

```bash
bun run dev
```

The application will be available at http://localhost:4269

For production deployment:

```bash
# Build the application
bun run build

# Start the production server
bun run start
```

## Using as an API Service

To use this load balancer as an API service for your applications:

1. Start the application and access the UI at http://localhost:4269
2. Go to the "API Keys" section and add your Gemini API keys through the UI
3. In your client application, configure the following:
   - Base URL: `http://localhost:4269/api/v1` (or your deployed URL)
   - API Key: Can be any string (the load balancer ignores this and uses its managed keys)
   - Model: Will be automatically populated from the available Gemini models

Example configuration in your client:
```javascript
const configuration = {
  baseURL: "http://localhost:4269/api/v1",
  apiKey: "any-string-works", // This is ignored by the load balancer
  model: "gemini-2.5-pro-exp" // Available models are shown in the dropdown
};
```

The load balancer will:
1. Receive your requests
2. Use its managed pool of API keys
3. Automatically rotate between keys to avoid rate limits
4. Return the Gemini API response to your application

Make sure that your terminal runnig this proxy is runnig when trying to put api requests. 

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
   - Check that the `.env` file is properly configured with the correct PORT

### Logs

The application logs are stored in the `logs` directory:
- `requests-YYYY-MM-DD.log`: Request logs
- `errors-YYYY-MM-DD.log`: Error logs
- `keys-YYYY-MM-DD.log`: Key event logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
