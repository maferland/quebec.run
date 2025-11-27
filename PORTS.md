# Configurable Ports

This project supports configurable ports through environment variables to avoid conflicts.

## Configuration

Add these to your `.env` file (copy from `.env.example`):

```bash
# Server port (default: 3000)
PORT=3000

# Mailhog Docker ports (default: 1025 for SMTP, 8025 for web UI)
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025

# Email server port (should match MAILHOG_SMTP_PORT)
EMAIL_SERVER_PORT=1025
```

## Usage

### Option 1: Use Mailhog binary (current setup)

```bash
npm run dev
```

This runs `mailhog` binary on default ports. If you need different ports, start mailhog manually:

```bash
mailhog -smtp-bind-addr :1026 -ui-bind-addr :8026
```

Then update `EMAIL_SERVER_PORT=1026` in `.env`.

### Option 2: Use Docker Compose (recommended)

```bash
# Start Mailhog with Docker
npm run docker:up

# Start dev server only
npm run dev:app

# Or start both together
npm run dev:docker

# Stop Docker services
npm run docker:down

# View Mailhog logs
npm run docker:logs
```

With Docker, you can customize ports in `.env`:

```bash
PORT=3001
MAILHOG_SMTP_PORT=1026
MAILHOG_WEB_PORT=8026
EMAIL_SERVER_PORT=1026
```

## Accessing Services

- **Next.js app**: `http://localhost:${PORT}` (default: 3000)
- **Mailhog UI**: `http://localhost:${MAILHOG_WEB_PORT}` (default: 8025)
- **Playwright tests**: Automatically use `PORT` from `.env`

## Troubleshooting

If ports are already in use:

1. Check what's using the port: `lsof -i :3000`
2. Update `.env` with different ports
3. Restart services

Example `.env` for avoiding conflicts:

```bash
PORT=3001
MAILHOG_SMTP_PORT=1026
MAILHOG_WEB_PORT=8026
EMAIL_SERVER_PORT=1026
```
