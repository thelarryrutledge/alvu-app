<script lang="ts">
	import { user, authStore } from '$lib/stores/auth'
	import { page } from '$app/stores'
	
	// Props
	export let title: string = 'Alvu'
	export let showNavigation: boolean = true
	
	// Navigation items
	const navigationItems = [
		{ name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
		{ name: 'Income', href: '/income', icon: 'income' },
		{ name: 'Envelopes', href: '/envelopes', icon: 'envelopes' },
		{ name: 'Expenses', href: '/expenses', icon: 'expenses' },
		{ name: 'Transactions', href: '/transactions', icon: 'transactions' },
		{ name: 'Categories', href: '/categories', icon: 'categories' }
	]
	
	// Mobile menu state
	let mobileMenuOpen = false
	
	// Handle logout
	async function handleLogout() {
		await authStore.signOut()
	}
	
	// Toggle mobile menu
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen
	}
	
	// Close mobile menu when clicking outside or navigating
	function closeMobileMenu() {
		mobileMenuOpen = false
	}
	
	// Get icon SVG for navigation items
	function getIcon(iconName: string): string {
		const icons: Record<string, string> = {
			dashboard: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h14a2 2 0 012 2v2" />`,
			income: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />`,
			envelopes: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />`,
			expenses: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />`,
			transactions: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />`,
			categories: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />`
		}
		return icons[iconName] || icons.dashboard
	}
	
	// Check if current route is active
	function isActiveRoute(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<!-- Logo and Title -->
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<h1 class="text-xl font-bold text-blue-600">Alvu</h1>
					</div>
					
					<!-- Desktop Navigation -->
					{#if showNavigation}
						<nav class="hidden md:ml-8 md:flex md:space-x-8">
							{#each navigationItems as item}
								<a
									href={item.href}
									class="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 {isActiveRoute(item.href)
										? 'text-blue-600 border-b-2 border-blue-600'
										: 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'}"
								>
									<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{@html getIcon(item.icon)}
									</svg>
									{item.name}
								</a>
							{/each}
						</nav>
					{/if}
				</div>

				<!-- User Menu and Mobile Menu Button -->
				<div class="flex items-center space-x-4">
					<!-- User Info -->
					{#if $user}
						<div class="hidden sm:flex sm:items-center sm:space-x-4">
							<span class="text-sm text-gray-700">
								{$user.user_metadata?.first_name || $user.email}
							</span>
							<a
								href="/profile"
								class="text-gray-400 hover:text-gray-500 transition-colors duration-200"
								title="Profile"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</a>
							<button
								on:click={handleLogout}
								class="text-gray-400 hover:text-gray-500 transition-colors duration-200"
								title="Sign Out"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
							</button>
						</div>
					{/if}

					<!-- Mobile menu button -->
					{#if showNavigation}
						<button
							on:click={toggleMobileMenu}
							class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
							aria-expanded={mobileMenuOpen}
						>
							<span class="sr-only">Open main menu</span>
							{#if mobileMenuOpen}
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							{:else}
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Mobile Navigation Menu -->
		{#if showNavigation && mobileMenuOpen}
			<div class="md:hidden">
				<div class="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
					{#each navigationItems as item}
						<a
							href={item.href}
							on:click={closeMobileMenu}
							class="flex items-center px-4 py-2 text-base font-medium transition-colors duration-200 {isActiveRoute(item.href)
								? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
						>
							<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{@html getIcon(item.icon)}
							</svg>
							{item.name}
						</a>
					{/each}
					
					<!-- Mobile User Actions -->
					{#if $user}
						<div class="border-t border-gray-200 pt-4 pb-3">
							<div class="px-4 mb-3">
								<div class="text-base font-medium text-gray-800">
									{$user.user_metadata?.first_name || 'User'}
								</div>
								<div class="text-sm text-gray-500">{$user.email}</div>
							</div>
							<div class="space-y-1">
								<a
									href="/profile"
									on:click={closeMobileMenu}
									class="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
								>
									<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									Profile
								</a>
								<button
									on:click={() => { closeMobileMenu(); handleLogout(); }}
									class="flex items-center w-full px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
								>
									<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									Sign Out
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>

<!-- Click outside to close mobile menu -->
{#if mobileMenuOpen}
	<div
		class="fixed inset-0 z-10 md:hidden"
		on:click={closeMobileMenu}
		on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()}
		role="button"
		tabindex="0"
		aria-label="Close menu"
	></div>
{/if}