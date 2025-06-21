# Alvu - Envelope Budget Manager

A Progressive Web Application for envelope-based budget management, built with SvelteKit and Tailwind CSS.

## Live Demo

🚀 **[View Live App](https://alvu-app.vercel.app/)**

## Overview

Alvu is a modern PWA that implements the envelope budgeting method, helping users manage their finances by allocating income into categorized "envelopes" for different spending purposes. The app focuses on manual transaction entry with a streamlined user experience for efficient budget management.

### Key Features

- 📱 **Progressive Web App** - Installable on mobile and desktop
- 💰 **Envelope Budgeting** - Organize spending with digital envelopes
- 📊 **Multiple Envelope Types** - Regular, Savings (with goals), and Debt tracking
- 💳 **Income Management** - Multiple income sources with flexible frequencies
- 🔄 **Real-time Allocation** - Dynamic fund distribution interface
- 📈 **Progress Tracking** - Visual indicators for savings goals and debt paydown
- 🔒 **Secure** - Built with Supabase authentication and Row Level Security

## Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel
- **PWA**: Service Worker + Web App Manifest

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/alvu-app.git
cd alvu-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

Follow the detailed guide in [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) to:

1. Create a new Supabase project
2. Obtain your API keys
3. Set up environment variables

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from .env.example and fill in your values
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_APP_NAME=Alvu
PUBLIC_APP_VERSION=0.0.1
NODE_ENV=development
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev -- --open    # Start dev server and open browser

# Building
npm run build            # Create production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check for linting errors
npm run lint:fix         # Fix linting errors automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Type Checking
npm run check            # Run Svelte type checking
npm run check:watch      # Run type checking in watch mode
```

## Project Structure

```
alvu-app/
├── src/
│   ├── lib/                    # Shared libraries
│   │   ├── components/         # Reusable Svelte components
│   │   ├── stores/             # Svelte stores for state management
│   │   ├── utils/              # Utility functions
│   │   └── types/              # TypeScript type definitions
│   ├── routes/                 # SvelteKit routes
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── income/             # Income management
│   │   ├── expenses/           # Expense tracking
│   │   ├── envelopes/          # Envelope management
│   │   └── api/                # API endpoints
│   └── app.html                # HTML template
├── static/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── test/                       # Test files
└── docs/                       # Documentation
```

See [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for detailed structure documentation.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed deployment instructions.

### Manual Deployment

```bash
npm run build
# Deploy the build/ directory to your hosting provider
```

## Testing

```bash
# Test Supabase connection
node test/test-supabase.js

# Run linting and formatting checks
npm run lint
npm run format:check
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Run code quality checks: `npm run lint && npm run format:check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Guidelines

- Follow the established project structure
- Use TypeScript for type safety
- Write meaningful commit messages
- Ensure code passes linting and formatting checks
- Test your changes thoroughly

## Security

- All database operations use Row Level Security (RLS)
- Environment variables are properly configured
- Input validation on all forms
- Secure authentication with Supabase Auth

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](PROJECT_STRUCTURE.md)
- 🐛 [Report Issues](https://github.com/your-username/alvu-app/issues)
- 💬 [Discussions](https://github.com/your-username/alvu-app/discussions)

## Roadmap

- [ ] Database schema implementation
- [ ] Authentication system
- [ ] Core envelope management
- [ ] Transaction processing
- [ ] Savings goal tracking
- [ ] Debt management
- [ ] Advanced reporting
- [ ] Mobile app versions

---

Built with ❤️ using SvelteKit, Tailwind CSS, and Supabase.
