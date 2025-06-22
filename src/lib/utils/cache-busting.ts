/**
 * Cache busting utilities for forcing fresh content delivery
 */

// Generate a unique cache-busting parameter
export function getCacheBuster(): string {
	return Date.now().toString()
}

// Add cache-busting parameter to URLs
export function addCacheBuster(url: string): string {
	const separator = url.includes('?') ? '&' : '?'
	return `${url}${separator}v=${getCacheBuster()}`
}

// Force reload of the current page with cache busting
export function forceReload(): void {
	const url = new URL(window.location.href)
	url.searchParams.set('v', getCacheBuster())
	window.location.href = url.toString()
}

// Clear all browser caches and reload
export async function clearCacheAndReload(): Promise<void> {
	try {
		// Clear service worker caches
		if ('caches' in window) {
			const cacheNames = await caches.keys()
			await Promise.all(
				cacheNames.map(cacheName => caches.delete(cacheName))
			)
		}

		// Unregister service worker
		if ('serviceWorker' in navigator) {
			const registrations = await navigator.serviceWorker.getRegistrations()
			await Promise.all(
				registrations.map(registration => registration.unregister())
			)
		}

		// Force reload
		forceReload()
	} catch (error) {
		console.error('Failed to clear cache:', error)
		// Fallback to regular reload
		window.location.reload()
	}
}

// Check if app version has changed (useful for showing update notifications)
export function checkForUpdates(): Promise<boolean> {
	return new Promise((resolve) => {
		if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				resolve(true)
			})

			// Check for updates
			navigator.serviceWorker.getRegistration().then(registration => {
				if (registration) {
					registration.update()
				}
			})
		} else {
			resolve(false)
		}
	})
}