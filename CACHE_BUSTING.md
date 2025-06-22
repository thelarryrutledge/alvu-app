# Cache Busting Solution for Vercel Deployment

This document explains the comprehensive cache-busting solution implemented to address aggressive caching issues with Vercel deployments.

## Problem

Vercel's aggressive caching was preventing new code changes from appearing without manually clearing browser cache and forcing hard reloads. This created a poor user experience where updates weren't visible immediately after deployment.

## Solution Overview

The solution implements multiple layers of cache control:

1. **Vercel Configuration** (`vercel.json`)
2. **Service Worker Cache Management** (`static/sw.js`)
3. **Build-time Cache Busting** (`vite.config.ts`, `svelte.config.js`)
4. **Runtime Cache Utilities** (`src/lib/utils/cache-busting.ts`)
5. **User Notification System** (`src/lib/components/UpdateNotification.svelte`)
6. **Deployment Automation** (`scripts/deploy.js`)

## Implementation Details

### 1. Vercel Configuration (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/(.*\\.html)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "/_app/immutable/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Key Features:**
- HTML files are never cached
- Immutable assets (with hashes) are cached for 1 year
- Service worker is always fresh
- Version files are never cached

### 2. Service Worker Cache Management

**Features:**
- Dynamic cache versioning with timestamps
- Automatic cache expiration (24 hours)
- Cache invalidation on updates
- Development mode detection (no caching in dev)

### 3. Build-time Cache Busting

**Vite Configuration:**
- Automatic hash generation for all assets
- Optimized chunk splitting
- Source map control

**SvelteKit Configuration:**
- Vercel adapter for optimal deployment
- Version-based cache busting
- Runtime version tracking

### 4. Runtime Cache Utilities

Available functions in `src/lib/utils/cache-busting.ts`:

```typescript
// Force reload with cache busting
forceReload()

// Clear all caches and reload
clearCacheAndReload()

// Check for app updates
checkForUpdates()

// Add cache buster to URLs
addCacheBuster(url)
```

### 5. User Notification System

The `UpdateNotification` component:
- Automatically detects when updates are available
- Shows user-friendly notification
- Provides one-click update functionality
- Handles cache clearing gracefully

### 6. Deployment Automation

Use the deployment script for optimal cache invalidation:

```bash
# Deploy with automatic cache busting
npm run deploy

# Deploy with explicit cache clearing
npm run deploy:force-cache-clear
```

## Usage Instructions

### For Developers (GitHub + Vercel Workflow)

1. **Regular Development:**
   - Use `npm run dev` as usual
   - Cache busting is disabled in development

2. **Regular Pushes (without cache busting):**
   ```bash
   # Quick push for regular development
   npm run push
   
   # Push with custom commit message
   npm run push "your commit message"
   ```

3. **Production Deployment (with cache busting):**
   ```bash
   # Deploy with cache invalidation - updates cache versions and pushes to GitHub
   npm run deploy
   
   # Alternative command (same functionality)
   npm run deploy:github
   ```

4. **Manual Git Workflow:**
   ```bash
   # For cache-busting deployment
   git add .
   git commit -m "your changes"
   npm run deploy  # This will update cache versions and push
   
   # For regular development
   git add .
   git commit -m "your changes"
   git push origin main  # Regular push without cache busting
   ```

5. **Force Cache Clear (if needed):**
   ```typescript
   import { clearCacheAndReload } from '$lib/utils/cache-busting'
   
   // In your component
   await clearCacheAndReload()
   ```

### For Users

1. **Automatic Updates:**
   - Users will see update notifications automatically
   - Click "Update Now" to get the latest version

2. **Manual Cache Clear:**
   - The app provides utilities to clear cache when needed
   - Updates are handled gracefully without data loss

## Testing the Solution

### 1. Test Cache Headers

```bash
# Check HTML caching
curl -I https://your-app.vercel.app/

# Check asset caching
curl -I https://your-app.vercel.app/_app/immutable/chunks/[hash].js
```

### 2. Test Service Worker

1. Open DevTools → Application → Service Workers
2. Check cache storage and versions
3. Verify cache expiration behavior

### 3. Test Update Notifications

1. Deploy a new version
2. Keep the app open in browser
3. Verify update notification appears
4. Test the update functionality

## Monitoring and Maintenance

### Cache Performance

Monitor these metrics:
- Cache hit rates
- Load times for returning users
- Update notification effectiveness

### Troubleshooting

**If users still see old content:**

1. Check Vercel headers are applied correctly
2. Verify service worker is updating
3. Check for browser-specific caching issues
4. Use the force cache clear utilities

**Common Issues:**

- **Service Worker not updating:** Check the cache version generation
- **Assets still cached:** Verify hash generation in build process
- **Update notifications not showing:** Check service worker registration

## Workflow Summary

### GitHub + Vercel Integration

Since you're using GitHub integration with Vercel:

1. **The deployment script (`npm run deploy`):**
   - Updates service worker cache version with timestamp
   - Creates version.json file
   - Commits these cache-busting files
   - Pushes to GitHub
   - Vercel automatically deploys from GitHub

2. **Regular development (`npm run push`):**
   - Simple git add, commit, push workflow
   - No cache busting overhead
   - Good for iterative development

3. **When to use each:**
   - Use `npm run push` for regular development and minor updates
   - Use `npm run deploy` when you need to ensure users get fresh content immediately

## Configuration Options

### Cache Expiration

Modify `MAX_CACHE_AGE` in `static/sw.js`:

```javascript
// 24 hours (default)
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000

// 1 hour (more aggressive)
const MAX_CACHE_AGE = 60 * 60 * 1000
```

### Update Notification Timing

Modify the update check frequency in `UpdateNotification.svelte`.

### Vercel Cache Headers

Adjust cache durations in `vercel.json` based on your needs.

## Best Practices

1. **Always use the deployment script** for production deployments
2. **Test cache behavior** in production environment
3. **Monitor user feedback** about update delivery
4. **Keep cache expiration reasonable** (24 hours is recommended)
5. **Use versioning** for major updates that require cache clearing

## Future Enhancements

- Background sync for offline updates
- Progressive update strategies
- User preference for update timing
- Analytics for cache performance
- Automated cache warming

---

This solution ensures that users always get the latest version of your app while maintaining optimal performance through intelligent caching strategies.