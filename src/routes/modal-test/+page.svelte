<script>
	let showModal = false;
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Simple Modal Test</h1>
	
	<button 
		on:click={() => showModal = true}
		class="bg-blue-600 text-white px-4 py-2 rounded"
	>
		Open Modal
	</button>
	
	{#if showModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white p-6 rounded-lg max-w-md">
				<h2 class="text-lg font-bold mb-4">Test Modal</h2>
				<p class="mb-4">This is a simple modal test.</p>
				<button 
					on:click={() => showModal = false}
					class="bg-gray-600 text-white px-4 py-2 rounded"
				>
					Close
				</button>
			</div>
		</div>
	{/if}
</div>