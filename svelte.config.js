import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use the Vercel adapter for optimal deployment
		adapter: adapter({
			// Enable edge runtime for better performance
			runtime: 'nodejs18.x'
		}),
		version: {
			// Enable versioning for cache busting
			name: process.env.npm_package_version || Date.now().toString()
		}
	}
}

export default config
