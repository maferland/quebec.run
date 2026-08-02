# Configurable Ports

This project supports configurable ports through environment variables to avoid conflicts.

## Configuration

Add these to your `.env` file (copy from `.env.example`):

```bash
# Server port (default: 3000)
PORT=3000

# Mailhog ports (code default: 1025 for SMTP, 8025 for web UI;
# `.env.example` ships 1026/8026 to stay clear of a system-wide Mailhog)
MAILHOG_SMTP_PORT=1026
MAILHOG_WEB_PORT=8026

# Email server port (should match MAILHOG_SMTP_PORT)
EMAIL_SERVER_PORT=1026
```

## Usage

`npm run dev` brings up docker-compose, waits for Mailhog to answer on
`MAILHOG_WEB_PORT`, and falls back to a local `mailhog` binary bound to your
configured SMTP and web ports if the container never comes up.

Docker services can also be driven on their own:

```bash
# Start Mailhog with Docker
npm run docker:up

# Stop Docker services
npm run docker:down

# View Mailhog logs
npm run docker:logs
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
