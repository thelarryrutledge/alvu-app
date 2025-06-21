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
	// Desktop sidebar state
	let sidebarCollapsed = false
	
	// Handle logout
	async function handleLogout() {
		await authStore.signOut()
	}
	
	// Toggle mobile menu
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen
	}
	
	// Toggle desktop sidebar
	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed
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
	{#if showNavigation}
		<!-- Desktop Sidebar -->
		<div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
			<div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
				<!-- Logo -->
				<div class="flex h-16 shrink-0 items-center">
					<h1 class="text-2xl font-bold text-blue-600">Alvu</h1>
				</div>
				
				<!-- Navigation -->
				<nav class="flex flex-1 flex-col">
					<ul role="list" class="flex flex-1 flex-col gap-y-7">
						<li>
							<ul role="list" class="-mx-2 space-y-1">
								{#each navigationItems as item}
									<li>
										<a
											href={item.href}
											class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200 {isActiveRoute(item.href)
												? 'bg-blue-50 text-blue-600'
												: 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}"
										>
											<svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												{@html getIcon(item.icon)}
											</svg>
											{item.name}
										</a>
									</li>
								{/each}
							</ul>
						</li>
						
						<!-- User Section -->
						{#if $user}
							<li class="mt-auto">
								<div class="border-t border-gray-200 pt-4">
									<div class="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
										<div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
											<span class="text-sm font-medium text-white">
												{($user.user_metadata?.first_name || $user.email || 'U').charAt(0).toUpperCase()}
											</span>
										</div>
										<span class="sr-only">Your profile</span>
										<span aria-hidden="true">{$user.user_metadata?.first_name || $user.email}</span>
									</div>
									<div class="space-y-1">
										<a
											href="/profile"
											class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
										>
											<svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
											</svg>
											Profile
										</a>
										<button
											on:click={handleLogout}
											class="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
										>
											<svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
											</svg>
											Sign Out
										</button>
									</div>
								</div>
							</li>
						{/if}
					</ul>
				</nav>
			</div>
		</div>

		<!-- Mobile Header -->
		<div class="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
			<button
				type="button"
				on:click={toggleMobileMenu}
				class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
			>
				<span class="sr-only">Open sidebar</span>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
				</svg>
			</button>
			<div class="flex-1 text-sm font-semibold leading-6 text-gray-900">
				<h1 class="text-xl font-bold text-blue-600">Alvu</h1>
			</div>
			{#if $user}
				<div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
					<span class="text-sm font-medium text-white">
						{($user.user_metadata?.first_name || $user.email || 'U').charAt(0).toUpperCase()}
					</span>
				</div>
			{/if}
		</div>

		<!-- Mobile Sidebar -->
		{#if mobileMenuOpen}
			<div class="relative z-50 lg:hidden" role="dialog" aria-modal="true">
				<div class="fixed inset-0 bg-gray-900/80" on:click={closeMobileMenu} on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()} role="button" tabindex="0" aria-label="Close menu"></div>
				<div class="fixed inset-0 flex">
					<div class="relative mr-16 flex w-full max-w-xs flex-1">
						<div class="absolute left-full top-0 flex w-16 justify-center pt-5">
							<button type="button" on:click={closeMobileMenu} class="-m-2.5 p-2.5">
								<span class="sr-only">Close sidebar</span>
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
							<div class="flex h-16 shrink-0 items-center">
								<h1 class="text-2xl font-bold text-blue-600">Alvu</h1>
							</div>
							<nav class="flex flex-1 flex-col">
								<ul role="list" class="flex flex-1 flex-col gap-y-7">
									<li>
										<ul role="list" class="-mx-2 space-y-1">
											{#each navigationItems as item}
												<li>
													<a
														href={item.href}
														on:click={closeMobileMenu}
														class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200 {isActiveRoute(item.href)
															? 'bg-blue-50 text-blue-600'
															: 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'}"
													>
														<svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															{@html getIcon(item.icon)}
														</svg>
														{item.name}
													</a>
												</li>
											{/each}
										</ul>
									</li>
									{#if $user}
										<li class="mt-auto">
											<div class="border-t border-gray-200 pt-4">
												<div class="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
													<div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
														<span class="text-sm font-medium text-white">
															{($user.user_metadata?.first_name || $user.email || 'U').charAt(0).toUpperCase()}
														</span>
													</div>
													<span>{$user.user_metadata?.first_name || $user.email}</span>
												</div>
												<div class="space-y-1">
													<a
														href="/profile"
														on:click={closeMobileMenu}
														class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
													>
														<svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
														</svg>
														Profile
													</a>
													<button
														on:click={() => { closeMobileMenu(); handleLogout(); }}
														class="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
													>
														<svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
														</svg>
														Sign Out
													</button>
												</div>
											</div>
										</li>
									{/if}
								</ul>
							</nav>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Main Content -->
	<main class="{showNavigation ? 'lg:pl-72' : ''} py-6 px-4 sm:px-6 lg:px-8">
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