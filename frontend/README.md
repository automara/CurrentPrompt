# CurrentPrompt Testing Portal

A simple admin UI for testing the CurrentPrompt markdown processing system with AI agents.

## Features

- Password-protected access
- Upload markdown files via drag & drop or paste
- Toggle between "Test Only" and "Save to Database" modes
- View detailed AI agent results:
  - Quality scores and validation
  - SEO metadata (title, description, keywords)
  - Categorization and tagging
  - Schema.org structured data
  - Image generation prompts
  - Vector embeddings
- Clean, responsive interface built with ShadCN UI components

## Setup

### Prerequisites

- Node.js 18+ installed
- Backend server configured and running (see main README)

### Installation

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your settings:
   ```env
   VITE_ADMIN_PASSWORD=your_password_here
   VITE_API_URL=http://localhost:3000
   ```

### Development

Run the development server:

```bash
npm run dev
```

The UI will be available at `http://localhost:5173`

### Production Build

Build the frontend for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, which the backend serves in production mode.

## Usage

1. Open the portal in your browser
2. Enter the admin password (set in `.env`)
3. Upload a markdown file or paste content directly
4. Choose between:
   - **Test Only**: Process with AI agents, see results, but don't save to database
   - **Save to DB**: Process AND save the module to the database
5. View the detailed results in the right panel

## Architecture

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Components**: ShadCN UI
- **Icons**: Lucide React

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ADMIN_PASSWORD` | Password for accessing the portal | `admin123` |
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

## API Endpoints Used

- `POST /api/test-agents` - Test mode (returns detailed results)
- `POST /api/modules/create` - Save mode (creates module in database)
- `GET /health` - Health check

## Security Note

This is designed as a personal testing tool. The password protection is client-side only. For production use, implement proper backend authentication.
