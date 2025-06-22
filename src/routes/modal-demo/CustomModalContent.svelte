<script lang="ts">
	export let userName: string = '';
	export let userEmail: string = '';
	
	let formData = {
		name: userName,
		email: userEmail,
		role: 'user',
		notifications: true,
		newsletter: false
	};
	
	function handleSubmit() {
		console.log('Form submitted:', formData);
		// In a real app, you would handle the form submission here
	}
</script>

<div class="space-y-6">
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
		<h4 class="text-blue-900 font-medium mb-2">Custom Component Modal</h4>
		<p class="text-blue-700 text-sm">
			This modal contains a custom Svelte component with its own props and state management.
		</p>
	</div>
	
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
				Full Name
			</label>
			<input
				id="name"
				type="text"
				bind:value={formData.name}
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				placeholder="Enter your full name"
			/>
		</div>
		
		<div>
			<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
				Email Address
			</label>
			<input
				id="email"
				type="email"
				bind:value={formData.email}
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				placeholder="Enter your email address"
			/>
		</div>
		
		<div>
			<label for="role" class="block text-sm font-medium text-gray-700 mb-1">
				Role
			</label>
			<select
				id="role"
				bind:value={formData.role}
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="user">User</option>
				<option value="admin">Admin</option>
				<option value="moderator">Moderator</option>
			</select>
		</div>
		
		<div class="space-y-3">
			<div class="flex items-center">
				<input
					id="notifications"
					type="checkbox"
					bind:checked={formData.notifications}
					class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label for="notifications" class="ml-2 block text-sm text-gray-700">
					Enable email notifications
				</label>
			</div>
			
			<div class="flex items-center">
				<input
					id="newsletter"
					type="checkbox"
					bind:checked={formData.newsletter}
					class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label for="newsletter" class="ml-2 block text-sm text-gray-700">
					Subscribe to newsletter
				</label>
			</div>
		</div>
		
		<div class="bg-gray-50 rounded-lg p-4">
			<h5 class="font-medium text-gray-900 mb-2">Current Values:</h5>
			<pre class="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">{JSON.stringify(formData, null, 2)}</pre>
		</div>
		
		<div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
			<button
				type="button"
				class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				on:click={() => {
					// Reset form
					formData = {
						name: userName,
						email: userEmail,
						role: 'user',
						notifications: true,
						newsletter: false
					};
				}}
			>
				Reset
			</button>
			<button
				type="submit"
				class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				Save Changes
			</button>
		</div>
	</form>
</div>