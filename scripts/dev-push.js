#!/usr/bin/env node

/**
 * Development push script - pushes changes without cache busting
 * Use this for regular development pushes when cache busting isn't needed
 */

import { execSync } from 'child_process'

function getCurrentBranch() {
	try {
		return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
	} catch (error) {
		return 'main'
	}
}

function hasUncommittedChanges() {
	try {
		const status = execSync('git status --porcelain', { encoding: 'utf8' })
		return status.trim().length > 0
	} catch (error) {
		console.log('⚠️  Not in a git repository or git not available')
		return false
	}
}

function devPush() {
	try {
		const branch = getCurrentBranch()
		console.log(`📍 Current branch: ${branch}`)
		
		// Check for uncommitted changes
		if (!hasUncommittedChanges()) {
			console.log('✅ No changes to commit')
			return
		}
		
		// Show status
		console.log('📋 Current status:')
		execSync('git status --short', { stdio: 'inherit' })
		
		// Ask for commit message (simplified - just use a default or timestamp)
		const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
		const commitMessage = process.argv[2] || `dev: updates ${timestamp}`
		
		console.log(`💾 Committing changes: ${commitMessage}`)
		execSync('git add .', { stdio: 'inherit' })
		execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' })
		
		console.log(`🚀 Pushing to ${branch}...`)
		execSync(`git push origin ${branch}`, { stdio: 'inherit' })
		
		console.log('\n✅ Development push completed!')
		console.log('🌐 Vercel will deploy automatically')
		
	} catch (error) {
		console.error('❌ Development push failed:', error.message)
		process.exit(1)
	}
}

// Run development push
devPush()