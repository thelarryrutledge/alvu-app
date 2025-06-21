# Alvu PWA - Deployment Guide

## Vercel Deployment

### Prerequisites

- Vercel account
- Supabase project set up
- GitHub repository (recommended for automatic deployments)

### Environment Variables

Before deploying, you'll need to set up the following environment variables in your Vercel project settings:

```bash
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_APP_NAME=Alvu
PUBLIC_APP_VERSION=0.0.1
NODE_ENV=production
```

### Deployment Steps

#### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel --prod`

#### Option 2: Deploy via GitHub Integration (Recommended)

1. Push your code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Vercel Configuration

The project includes a `vercel.json` configuration file with:

- SvelteKit framework detection
- Proper headers for PWA functionality
- Security headers (CSRF protection, XSS protection)
- Service worker caching configuration
- API route handling for future Supabase functions

### Post-Deployment Checklist

- [ ] Verify PWA installation works on mobile devices
- [ ] Test service worker functionality
- [ ] Confirm manifest.json loads correctly
- [ ] Validate environment variables are set
- [ ] Test responsive design across devices
- [ ] Verify security headers are applied

### Custom Domain Setup

1. Add custom domain in Vercel dashboard
2. Configure DNS records as instructed
3. SSL certificate will be automatically provisioned

### Monitoring and Analytics

- Vercel provides built-in analytics
- Error tracking via Vercel dashboard
- Performance monitoring included

### Troubleshooting

- Check Vercel function logs for API issues
- Verify environment variables are properly set
- Ensure Supabase URL and keys are correct
- Test PWA functionality in incognito mode

### Development vs Production

- Development: `npm run dev` (localhost:5173)
- Production: Deployed on Vercel with optimized build
- Environment variables automatically handled per environment
