<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import FormInput from '$lib/components/FormInput.svelte';
	import FormTextarea from '$lib/components/FormTextarea.svelte';
	import FormSelect, { type SelectOption } from '$lib/components/FormSelect.svelte';
	import FormCheckbox from '$lib/components/FormCheckbox.svelte';
	import FormRadioGroup, { type RadioOption } from '$lib/components/FormRadioGroup.svelte';
	import { toastHelpers } from '$lib/stores/toast';
	
	// Form data
	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		phone: '',
		website: '',
		age: 0,
		bio: '',
		country: '',
		newsletter: false,
		notifications: false,
		theme: '',
		plan: ''
	};
	
	// Form validation errors
	let errors: Record<string, string> = {};
	
	// Select options
	const countryOptions: SelectOption[] = [
		{ value: 'us', label: 'United States' },
		{ value: 'ca', label: 'Canada' },
		{ value: 'uk', label: 'United Kingdom' },
		{ value: 'au', label: 'Australia' },
		{ value: 'de', label: 'Germany' },
		{ value: 'fr', label: 'France' },
		{ value: 'jp', label: 'Japan' },
		{ value: 'other', label: 'Other' }
	];
	
	// Radio options
	const themeOptions: RadioOption[] = [
		{ 
			value: 'light', 
			label: 'Light Theme', 
			description: 'Clean and bright interface' 
		},
		{ 
			value: 'dark', 
			label: 'Dark Theme', 
			description: 'Easy on the eyes for low-light environments' 
		},
		{ 
			value: 'auto', 
			label: 'Auto Theme', 
			description: 'Follows your system preference' 
		}
	];
	
	const planOptions: RadioOption[] = [
		{ value: 'free', label: 'Free Plan', description: 'Basic features for personal use' },
		{ value: 'pro', label: 'Pro Plan', description: 'Advanced features for professionals' },
		{ value: 'team', label: 'Team Plan', description: 'Collaboration tools for teams' }
	];
	
	// Validation function
	function validateForm() {
		errors = {};
		
		if (!formData.firstName.trim()) {
			errors.firstName = 'First name is required';
		}
		
		if (!formData.lastName.trim()) {
			errors.lastName = 'Last name is required';
		}
		
		if (!formData.email.trim()) {
			errors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = 'Please enter a valid email address';
		}
		
		if (!formData.password.trim()) {
			errors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		}
		
		if (formData.age < 13) {
			errors.age = 'You must be at least 13 years old';
		}
		
		if (!formData.country) {
			errors.country = 'Please select your country';
		}
		
		if (!formData.theme) {
			errors.theme = 'Please select a theme preference';
		}
		
		if (!formData.plan) {
			errors.plan = 'Please select a plan';
		}
		
		return Object.keys(errors).length === 0;
	}
	
	// Handle form submission
	function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (validateForm()) {
			toastHelpers.success('Form submitted successfully!', {
				title: 'Success'
			});
			console.log('Form data:', formData);
		} else {
			toastHelpers.error('Please fix the errors below', {
				title: 'Validation Error'
			});
		}
	}
	
	// Reset form
	function resetForm() {
		formData = {
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			phone: '',
			website: '',
			age: 0,
			bio: '',
			country: '',
			newsletter: false,
			notifications: false,
			theme: '',
			plan: ''
		};
		errors = {};
		toastHelpers.info('Form has been reset');
	}
</script>

<svelte:head>
	<title>Form Components Demo - Alvu Budget App</title>
</svelte:head>

<AppLayout>
	<div class="max-w-4xl mx-auto p-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Form Components Demo</h1>
			<p class="text-gray-600">
				Comprehensive showcase of all form input components with validation and different variants.
			</p>
		</div>
		
		<form on:submit={handleSubmit} class="space-y-8">
			<!-- Basic Text Inputs -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Text Inputs</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="First Name"
						bind:value={formData.firstName}
						placeholder="Enter your first name"
						required
						error={errors.firstName}
					/>
					
					<FormInput
						label="Last Name"
						bind:value={formData.lastName}
						placeholder="Enter your last name"
						required
						error={errors.lastName}
					/>
					
					<FormInput
						type="email"
						label="Email Address"
						bind:value={formData.email}
						placeholder="you@example.com"
						required
						error={errors.email}
						hint="We'll never share your email with anyone else"
					/>
					
					<FormInput
						type="password"
						label="Password"
						bind:value={formData.password}
						placeholder="Enter a secure password"
						required
						error={errors.password}
						hint="Must be at least 8 characters"
					/>
				</div>
			</div>
			
			<!-- Specialized Inputs -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Specialized Inputs</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						type="tel"
						label="Phone Number"
						bind:value={formData.phone}
						placeholder="+1 (555) 123-4567"
						hint="Optional - for account recovery"
					/>
					
					<FormInput
						type="url"
						label="Website"
						bind:value={formData.website}
						placeholder="https://example.com"
						hint="Your personal or business website"
					/>
					
					<FormInput
						type="number"
						label="Age"
						bind:value={formData.age}
						min="13"
						max="120"
						required
						error={errors.age}
						hint="Must be 13 or older"
					/>
					
					<FormSelect
						label="Country"
						bind:value={formData.country}
						options={countryOptions}
						placeholder="Select your country"
						required
						error={errors.country}
					/>
				</div>
			</div>
			
			<!-- Textarea -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Textarea</h2>
				<FormTextarea
					label="Bio"
					bind:value={formData.bio}
					placeholder="Tell us about yourself..."
					rows={4}
					maxlength={500}
					hint="Share a brief description about yourself"
				/>
			</div>
			
			<!-- Checkboxes -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Checkboxes</h2>
				<div class="space-y-4">
					<FormCheckbox
						label="Subscribe to newsletter"
						bind:checked={formData.newsletter}
						description="Get updates about new features and promotions"
					/>
					
					<FormCheckbox
						label="Enable notifications"
						bind:checked={formData.notifications}
						description="Receive push notifications for important updates"
					/>
				</div>
			</div>
			
			<!-- Radio Groups -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Radio Groups</h2>
				<div class="space-y-6">
					<FormRadioGroup
						label="Theme Preference"
						bind:value={formData.theme}
						options={themeOptions}
						required
						error={errors.theme}
						hint="Choose your preferred interface theme"
					/>
					
					<FormRadioGroup
						label="Subscription Plan"
						bind:value={formData.plan}
						options={planOptions}
						orientation="horizontal"
						required
						error={errors.plan}
					/>
				</div>
			</div>
			
			<!-- Form Actions -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Form Actions</h2>
				<div class="flex flex-wrap gap-4">
					<button
						type="submit"
						class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Submit Form
					</button>
					
					<button
						type="button"
						class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
						on:click={resetForm}
					>
						Reset Form
					</button>
				</div>
			</div>
			
			<!-- Form Data Preview -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Form Data Preview</h2>
				<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{JSON.stringify(formData, null, 2)}</pre>
			</div>
		</form>
	</div>
</AppLayout>