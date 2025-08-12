# Courses - Quebec Run Clubs

A modern web application for discovering and managing run clubs in Quebec City.
Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🏃‍♂️ Features

- **Discover Run Clubs**: Browse through local running clubs with detailed
  information
- **Upcoming Runs**: View scheduled runs with dates, distances, and locations
- **User Authentication**: Passwordless email authentication via NextAuth
- **Admin Dashboard**: Club owners can manage their clubs and runs
- **Responsive Design**: Beautiful UI that works on all devices
- **Map Integration**: Interactive map view (coming soon)
- **Calendar View**: Calendar interface for browsing runs (coming soon)

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with
  [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with email
  providers
- **Email**: [Resend](https://resend.com/) for production,
  [Mailhog](https://github.com/mailhog/MailHog) for development
- **Validation**: [Zod](https://github.com/colinhacks/zod) for environment
  variables and forms
- **Date Handling**: [date-fns](https://date-fns.org/)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend API key (for production email)
- Mailhog (for development email testing)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/courses.git
   cd courses
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/courses?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-nextauth-secret-key-32-chars-minimum"
   NEXTAUTH_URL="http://localhost:3000"

   # Email Configuration
   EMAIL_FROM="noreply@yourdomain.com"
   USE_RESEND=false  # Set to true for production

   # Development (Mailhog)
   EMAIL_SERVER_HOST="localhost"
   EMAIL_SERVER_PORT="1025"

   # Production (Resend)
   RESEND_API_KEY="your-resend-api-key"
   ```

4. **Set up the database**

   ```bash
   npx prisma migrate dev
   npx prisma db seed  # Optional: seed with sample data
   ```

5. **Start development servers**

   ```bash
   npm run dev
   ```

   This runs both the Next.js app and Mailhog concurrently:

   - App: http://localhost:3000
   - Mailhog UI: http://localhost:8025

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   └── (auth)/           # Authentication pages
├── components/            # React components
│   ├── layout/           # Layout components (header, footer)
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── env.ts            # Environment validation
│   └── clubs.ts          # Database service functions
└── prisma/               # Database schema and migrations
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Mailhog
- `npm run dev:app` - Start only the Next.js app
- `npm run dev:mail` - Start only Mailhog
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Database Management

```bash
# Create and apply a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

### Email Testing

In development, emails are captured by Mailhog:

- Web UI: http://localhost:8025
- SMTP: localhost:1025

For production, configure Resend:

1. Get API key from [Resend](https://resend.com/)
2. Set `USE_RESEND=true` in environment
3. Add your `RESEND_API_KEY`

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**

   ```env
   USE_RESEND=true
   RESEND_API_KEY="your-production-resend-key"
   DATABASE_URL="your-production-database-url"
   NEXTAUTH_URL="https://yourdomain.com"
   ```

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

### Deployment Platforms

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Railway**: Database and app hosting with automatic scaling
- **Digital Ocean**: App Platform with managed databases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Reference

### Club Endpoints

- `GET /api/clubs` - List all clubs
- `POST /api/clubs` - Create new club (authenticated)
- `PUT /api/clubs/[id]` - Update club (owner/admin only)
- `DELETE /api/clubs/[id]` - Delete club (admin only)

### Run Endpoints

- `GET /api/runs` - List all runs
- `POST /api/runs` - Create new run (club owner)
- `PUT /api/runs/[id]` - Update run (club owner)
- `DELETE /api/runs/[id]` - Delete run (club owner)

## 🔒 Security

- **Authentication**: Email-based passwordless authentication
- **Authorization**: Role-based access control (user/admin)
- **Environment**: Zod validation for all environment variables
- **Database**: Prisma ORM prevents SQL injection
- **HTTPS**: Enforced in production via Next.js security headers

## 🗺️ Roadmap

- [ ] **v0.1** - Basic club and run management ✅
- [ ] **v0.2** - Interactive map integration
- [ ] **v0.3** - Calendar view for runs
- [ ] **v0.4** - User profiles and run history
- [ ] **v0.5** - Social features (comments, ratings)
- [ ] **v1.0** - Mobile app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- Quebec City running community
- All contributors and testers

## 📞 Support

- Create an [issue](https://github.com/yourusername/courses/issues) for bug
  reports
- Start a [discussion](https://github.com/yourusername/courses/discussions) for
  questions
- Email: support@yourdomain.com

---

**Made with ❤️ for the Quebec running community**
