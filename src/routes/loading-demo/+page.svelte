<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte'
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import PageLoading from '$lib/components/PageLoading.svelte'
	
	// Demo state
	let buttonLoading = false
	let showPageLoading = false
	let showOverlay = false
	
	// Demo functions
	function simulateButtonLoading() {
		buttonLoading = true
		setTimeout(() => {
			buttonLoading = false
		}, 3000)
	}
	
	function showPageLoadingDemo() {
		showPageLoading = true
		setTimeout(() => {
			showPageLoading = false
		}, 4000)
	}
	
	function showOverlayDemo() {
		showOverlay = true
		setTimeout(() => {
			showOverlay = false
		}, 3000)
	}
</script>

<svelte:head>
	<title>Loading Components Demo - Alvu</title>
</svelte:head>

{#if showPageLoading}
	<PageLoading 
		title="Loading Demo Page" 
		subtitle="Demonstrating full-page loading state"
		variant="spinner"
	/>
{:else}
	<AppLayout title="Loading Components Demo - Alvu" showBottomNav={false}>
		<div class="max-w-4xl mx-auto">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900">Loading Components Demo</h1>
				<p class="text-gray-600 mt-2">Showcase of all loading spinner components and variants</p>
			</div>

			<!-- Loading Spinner Variants -->
			<section class="mb-12">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">Loading Spinner Variants</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<!-- Spinner Variant -->
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Spinner</h3>
						<LoadingSpinner variant="spinner" size="lg" color="primary" text="Loading..." />
					</div>
					
					<!-- Dots Variant -->
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Dots</h3>
						<LoadingSpinner variant="dots" size="lg" color="primary" text="Processing..." />
					</div>
					
					<!-- Pulse Variant -->
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Pulse</h3>
						<LoadingSpinner variant="pulse" size="lg" color="primary" text="Syncing..." />
					</div>
					
					<!-- Bars Variant -->
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<h3 class="text-lg font-medium text-gray-900 mb-4">Bars</h3>
						<LoadingSpinner variant="bars" size="lg" color="primary" text="Analyzing..." />
					</div>
				</div>
			</section>

			<!-- Size Variations -->
			<section class="mb-12">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">Size Variations</h2>
				
				<div class="bg-white p-8 rounded-lg shadow">
					<div class="flex items-center justify-around">
						<div class="text-center">
							<p class="text-sm text-gray-600 mb-2">Small</p>
							<LoadingSpinner variant="spinner" size="sm" color="primary" />
						</div>
						<div class="text-center">
							<p class="text-sm text-gray-600 mb-2">Medium</p>
							<LoadingSpinner variant="spinner" size="md" color="primary" />
						</div>
						<div class="text-center">
							<p class="text-sm text-gray-600 mb-2">Large</p>
							<LoadingSpinner variant="spinner" size="lg" color="primary" />
						</div>
						<div class="text-center">
							<p class="text-sm text-gray-600 mb-2">Extra Large</p>
							<LoadingSpinner variant="spinner" size="xl" color="primary" />
						</div>
					</div>
				</div>
			</section>

			<!-- Color Variations -->
			<section class="mb-12">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">Color Variations</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<p class="text-sm text-gray-600 mb-4">Primary</p>
						<LoadingSpinner variant="spinner" size="lg" color="primary" />
					</div>
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<p class="text-sm text-gray-600 mb-4">Secondary</p>
						<LoadingSpinner variant="spinner" size="lg" color="secondary" />
					</div>
					<div class="bg-gray-800 p-6 rounded-lg shadow text-center">
						<p class="text-sm text-gray-300 mb-4">White</p>
						<LoadingSpinner variant="spinner" size="lg" color="white" />
					</div>
					<div class="bg-white p-6 rounded-lg shadow text-center">
						<p class="text-sm text-gray-600 mb-4">Gray</p>
						<LoadingSpinner variant="spinner" size="lg" color="gray" />
					</div>
				</div>
			</section>

			<!-- Loading Buttons -->
			<section class="mb-12">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">Loading Buttons</h2>
				
				<div class="bg-white p-8 rounded-lg shadow">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<LoadingButton
							variant="primary"
							loading={buttonLoading}
							loadingText="Saving..."
							on:click={simulateButtonLoading}
						>
							Save Changes
						</LoadingButton>
						
						<LoadingButton 
							variant="secondary" 
							loading={false}
						>
							Cancel
						</LoadingButton>
						
						<LoadingButton 
							variant="outline" 
							loading={false}
						>
							Edit
						</LoadingButton>
						
						<LoadingButton 
							variant="ghost" 
							loading={false}
						>
							Delete
						</LoadingButton>
					</div>
					
					<div class="mt-6">
						<LoadingButton 
							variant="primary" 
							size="lg"
							fullWidth={true}
							loading={false}
						>
							Full Width Button
						</LoadingButton>
					</div>
				</div>
			</section>

			<!-- Demo Controls -->
			<section class="mb-12">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">Interactive Demos</h2>
				
				<div class="bg-white p-8 rounded-lg shadow">
					<div class="space-y-4">
						<button 
							on:click={showPageLoadingDemo}
							class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
						>
							Demo Page Loading (4s)
						</button>
						
						<button 
							on:click={showOverlayDemo}
							class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors ml-4"
						>
							Demo Overlay Loading (3s)
						</button>
					</div>
				</div>
			</section>

			<!-- Usage Examples -->
			<section class="mb-12">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">Usage Examples</h2>
				
				<div class="bg-white p-8 rounded-lg shadow">
					<div class="space-y-6">
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-2">Inline Loading</h3>
							<div class="flex items-center space-x-3">
								<LoadingSpinner variant="spinner" size="sm" color="primary" />
								<span class="text-gray-600">Fetching data...</span>
							</div>
						</div>
						
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-2">Centered Loading</h3>
							<div class="h-32 border-2 border-dashed border-gray-300 rounded-lg">
								<LoadingSpinner 
									variant="dots" 
									size="md" 
									color="primary" 
									text="Loading content..."
									centered={true}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	</AppLayout>
{/if}

<!-- Overlay Demo -->
{#if showOverlay}
	<LoadingSpinner 
		variant="spinner" 
		size="xl" 
		color="primary" 
		text="Processing request..."
		overlay={true}
	/>
{/if}