// Cache version updated by deployment script
const CACHE_VERSION = 1750630968219
const CACHE_NAME = `alvu-v${CACHE_VERSION}`
const STATIC_CACHE_URLS = [
	'/',
	'/manifest.json',
	'/favicon.png'
	// Add other static assets as they're created
]

// Maximum cache age in milliseconds (24 hours)
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000

// Install event - cache static assets
self.addEventListener('install', (event) => {
	console.log('Service Worker: Installing...')
	
	// Skip caching in development mode
	const isDevelopment = self.location.hostname === 'localhost' ||
						  self.location.hostname === '127.0.0.1' ||
						  self.location.port === '5173' ||
						  self.location.port === '4173'

	if (isDevelopment) {
		console.log('Service Worker: Development mode detected, skipping cache')
		event.waitUntil(self.skipWaiting())
		return
	}

	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('Service Worker: Caching static assets')
				return cache.addAll(STATIC_CACHE_URLS)
			})
			.then(() => {
				console.log('Service Worker: Installation complete')
				return self.skipWaiting()
			})
			.catch((error) => {
				console.error('Service Worker: Installation failed', error)
			})
	)
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('Service Worker: Activating...')
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						// Delete all old alvu caches
						if (cacheName.startsWith('alvu-v') && cacheName !== CACHE_NAME) {
							console.log('Service Worker: Deleting old cache', cacheName)
							return caches.delete(cacheName)
						}
					})
				)
			})
			.then(() => {
				console.log('Service Worker: Activation complete')
				// Force all clients to use the new service worker
				return self.clients.claim()
			})
	)
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return
	}

	// Skip external requests (Supabase API calls)
	if (!event.request.url.startsWith(self.location.origin)) {
		return
	}

	// Skip caching in development mode (when running on localhost or with Vite dev server)
	const isDevelopment = self.location.hostname === 'localhost' ||
						  self.location.hostname === '127.0.0.1' ||
						  self.location.port === '5173' ||
						  self.location.port === '4173'

	if (isDevelopment) {
		// In development, always fetch from network to get fresh content
		event.respondWith(fetch(event.request))
		return
	}

	event.respondWith(
		caches.match(event.request).then(async (cachedResponse) => {
			// Check if cached response is still fresh
			if (cachedResponse) {
				const cachedTime = cachedResponse.headers.get('sw-cache-time')
				if (cachedTime) {
					const age = Date.now() - parseInt(cachedTime)
					if (age > MAX_CACHE_AGE) {
						console.log('Service Worker: Cache expired, fetching fresh content')
						// Cache expired, fetch fresh content
						return fetchAndCache(event.request)
					}
				}
				return cachedResponse
			}

			// No cache, fetch from network
			return fetchAndCache(event.request)
		})
	)
})

// Helper function to fetch and cache responses
async function fetchAndCache(request) {
	try {
		const response = await fetch(request)
		
		// Don't cache non-successful responses
		if (!response || response.status !== 200 || response.type !== 'basic') {
			return response
		}

		// Clone the response for caching
		const responseToCache = response.clone()
		
		// Add timestamp header for cache expiration
		const headers = new Headers(responseToCache.headers)
		headers.set('sw-cache-time', Date.now().toString())
		
		const cachedResponse = new Response(responseToCache.body, {
			status: responseToCache.status,
			statusText: responseToCache.statusText,
			headers: headers
		})

		// Cache the response
		const cache = await caches.open(CACHE_NAME)
		await cache.put(request, cachedResponse)

		return response
	} catch (error) {
		console.error('Service Worker: Fetch failed', error)
		// If network fails and no cache, return offline page
		if (request.destination === 'document') {
			return caches.match('/')
		}
		throw error
	}
}

// Background sync for offline transactions (future enhancement)
self.addEventListener('sync', (event) => {
	if (event.tag === 'background-sync-transactions') {
		console.log('Service Worker: Background sync triggered')
		event.waitUntil(syncTransactions())
	}
})

// Placeholder for future transaction sync functionality
async function syncTransactions() {
	// This will be implemented when we add offline transaction queuing
	console.log('Service Worker: Syncing offline transactions...')
}

// Push notification handling (future enhancement)
self.addEventListener('push', (event) => {
	if (event.data) {
		const data = event.data.json()
		const options = {
			body: data.body,
			icon: '/favicon.png',
			badge: '/favicon.png',
			vibrate: [100, 50, 100],
			data: {
				dateOfArrival: Date.now(),
				primaryKey: data.primaryKey
			}
		}

		event.waitUntil(self.registration.showNotification(data.title, options))
	}
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
	console.log('Service Worker: Notification clicked')
	event.notification.close()

	event.waitUntil(clients.openWindow('/'))
})
