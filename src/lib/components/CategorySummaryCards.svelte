<script lang="ts">
	import type { Category } from '$lib/types/database'
	
	export let categories: Category[]
	
	$: defaultCategories = categories.filter(category => category.is_default)
	$: customCategories = categories.filter(category => !category.is_default)
</script>

<!-- Summary Cards -->
<section class="grid grid-cols-1 md:grid-cols-3 gap-6">
	<div class="bg-white overflow-hidden shadow rounded-lg">
		<div class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Total Categories</dt>
						<dd class="text-2xl font-bold text-gray-900">{categories.length}</dd>
						<dd class="text-sm text-gray-600 mt-1">{defaultCategories.length} default, {customCategories.length} custom</dd>
					</dl>
				</div>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg">
		<div class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Default Categories</dt>
						<dd class="text-2xl font-bold text-gray-900">{defaultCategories.length}</dd>
						<dd class="text-sm text-gray-600 mt-1">System provided</dd>
					</dl>
				</div>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg">
		<div class="p-6">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Custom Categories</dt>
						<dd class="text-2xl font-bold text-gray-900">{customCategories.length}</dd>
						<dd class="text-sm text-gray-600 mt-1">User created</dd>
					</dl>
				</div>
			</div>
		</div>
	</div>
</section>