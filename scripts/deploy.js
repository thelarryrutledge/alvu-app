#!/usr/bin/env node

/**
 * Pre-deployment script with cache invalidation for GitHub + Vercel workflow
 * This script updates cache versions and commits changes before pushing to trigger Vercel deployment
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

const DEPLOYMENT_TIMESTAMP = Date.now()
const VERSION = process.env.npm_package_version || '0.0.1'

console.log('🚀 Starting pre-deployment with cache invalidation...')

// Update service worker with new cache version
function updateServiceWorkerVersion() {
	console.log('📝 Updating service worker cache version...')
	
	const swPath = join(process.cwd(), 'static/sw.js')
	let swContent = readFileSync(swPath, 'utf8')
	
	// Replace the cache version with deployment timestamp
	swContent = swContent.replace(
		/const CACHE_VERSION = \d+/,
		`const CACHE_VERSION = ${DEPLOYMENT_TIMESTAMP}`
	)
	
	writeFileSync(swPath, swContent)
	console.log(`✅ Service worker updated with cache version: ${DEPLOYMENT_TIMESTAMP}`)
}

// Create a version file for runtime cache busting
function createVersionFile() {
	console.log('📄 Creating version file...')
	
	const versionInfo = {
		version: VERSION,
		buildTime: DEPLOYMENT_TIMESTAMP,
		buildDate: new Date().toISOString()
	}
	
	writeFileSync(
		join(process.cwd(), 'static/version.json'),
		JSON.stringify(versionInfo, null, 2)
	)
	
	console.log(`✅ Version file created: ${JSON.stringify(versionInfo)}`)
}

// Check if there are uncommitted changes
function hasUncommittedChanges() {
	try {
		const status = execSync('git status --porcelain', { encoding: 'utf8' })
		return status.trim().length > 0
	} catch {
		console.log('⚠️  Not in a git repository or git not available')
		return false
	}
}

// Get current branch name
function getCurrentBranch() {
	try {
		return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
	} catch {
		return 'main'
	}
}

// Run the pre-deployment process
function deploy() {
	try {
		const branch = getCurrentBranch()
		console.log(`📍 Current branch: ${branch}`)
		
		// Check for uncommitted changes (excluding the files we're about to update)
		if (hasUncommittedChanges()) {
			console.log('⚠️  You have uncommitted changes. Please commit or stash them first.')
			console.log('💡 Run: git status to see uncommitted changes')
			process.exit(1)
		}
		
		// Update cache versions
		updateServiceWorkerVersion()
		createVersionFile()
		
		// Stage the updated files
		console.log('📦 Staging cache-busting files...')
		execSync('git add static/sw.js static/version.json', { stdio: 'inherit' })
		
		// Commit the cache-busting changes
		const commitMessage = `chore: update cache version to ${DEPLOYMENT_TIMESTAMP}`
		console.log(`💾 Committing cache-busting changes: ${commitMessage}`)
		execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
		
		// Push to trigger Vercel deployment
		console.log(`🚀 Pushing to ${branch} to trigger Vercel deployment...`)
		execSync(`git push origin ${branch}`, { stdio: 'inherit' })
		
		console.log('\n🎉 Pre-deployment process completed!')
		console.log(`📊 Cache version: ${DEPLOYMENT_TIMESTAMP}`)
		console.log(`📦 App version: ${VERSION}`)
		console.log('🌐 Vercel will automatically deploy from GitHub')
		console.log('⏱️  Check your Vercel dashboard for deployment status')
		
	} catch (error) {
		console.error('❌ Pre-deployment failed:', error.message)
		process.exit(1)
	}
}

// Run deployment
deploy()