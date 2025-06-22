import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		// Enable source maps for better debugging
		sourcemap: false,
		// Optimize chunk splitting for better caching
		rollupOptions: {
			output: {
				// Add hash to filenames for cache busting
				entryFileNames: '_app/immutable/entry/[name]-[hash].js',
				chunkFileNames: '_app/immutable/chunks/[name]-[hash].js',
				assetFileNames: '_app/immutable/assets/[name]-[hash].[ext]'
			}
		}
	},
	server: {
		// Disable caching in development
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	}
})
