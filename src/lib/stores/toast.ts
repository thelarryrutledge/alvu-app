import { writable } from 'svelte/store';

export interface ToastConfig {
	id: string;
	title?: string;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration?: number; // in milliseconds, 0 means persistent
	dismissible?: boolean;
	action?: {
		label: string;
		handler: () => void;
	};
	onDismiss?: () => void;
}

interface ToastState {
	toasts: ToastConfig[];
}

const initialState: ToastState = {
	toasts: []
};

function createToastStore() {
	const { subscribe, set, update } = writable<ToastState>(initialState);

	return {
		subscribe,
		
		// Add a toast
		add: (config: Omit<ToastConfig, 'id'> & { id?: string }) => {
			const id = config.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			const toastConfig: ToastConfig = {
				duration: 5000, // Default 5 seconds
				dismissible: true,
				...config,
				id
			};
			
			update(state => ({
				...state,
				toasts: [...state.toasts, toastConfig]
			}));
			
			// Auto-dismiss after duration if not persistent
			if (toastConfig.duration && toastConfig.duration > 0) {
				setTimeout(() => {
					toastStore.dismiss(id);
				}, toastConfig.duration);
			}
			
			return id;
		},
		
		// Dismiss a specific toast by ID
		dismiss: (id: string) => {
			update(state => {
				const toast = state.toasts.find(t => t.id === id);
				if (toast?.onDismiss) {
					toast.onDismiss();
				}
				
				return {
					...state,
					toasts: state.toasts.filter(toast => toast.id !== id)
				};
			});
		},
		
		// Clear all toasts
		clear: () => {
			update(state => {
				// Call onDismiss for all toasts
				state.toasts.forEach(toast => {
					if (toast.onDismiss) {
						toast.onDismiss();
					}
				});
				
				return {
					...state,
					toasts: []
				};
			});
		},
		
		// Update a toast
		update: (id: string, updates: Partial<Omit<ToastConfig, 'id'>>) => {
			update(state => ({
				...state,
				toasts: state.toasts.map(toast => 
					toast.id === id ? { ...toast, ...updates } : toast
				)
			}));
		}
	};
}

export const toastStore = createToastStore();

// Helper functions for common toast types
export const toastHelpers = {
	// Success toast
	success: (message: string, options?: Partial<Omit<ToastConfig, 'id' | 'type' | 'message'>>) => {
		return toastStore.add({
			message,
			type: 'success',
			...options
		});
	},
	
	// Error toast
	error: (message: string, options?: Partial<Omit<ToastConfig, 'id' | 'type' | 'message'>>) => {
		return toastStore.add({
			message,
			type: 'error',
			duration: 0, // Persistent by default for errors
			...options
		});
	},
	
	// Warning toast
	warning: (message: string, options?: Partial<Omit<ToastConfig, 'id' | 'type' | 'message'>>) => {
		return toastStore.add({
			message,
			type: 'warning',
			duration: 7000, // Longer duration for warnings
			...options
		});
	},
	
	// Info toast
	info: (message: string, options?: Partial<Omit<ToastConfig, 'id' | 'type' | 'message'>>) => {
		return toastStore.add({
			message,
			type: 'info',
			...options
		});
	},
	
	// Loading toast (persistent until manually dismissed)
	loading: (message: string, options?: Partial<Omit<ToastConfig, 'id' | 'type' | 'message'>>) => {
		return toastStore.add({
			message,
			type: 'info',
			duration: 0, // Persistent
			dismissible: false,
			...options
		});
	}
};