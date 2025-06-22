import { writable } from 'svelte/store';

export interface ModalConfig {
	id: string;
	title?: string;
	content?: string;
	component?: any;
	props?: Record<string, any>;
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	variant?: 'default' | 'confirmation' | 'danger' | 'success' | 'info';
	closeOnBackdrop?: boolean;
	closeOnEscape?: boolean;
	persistent?: boolean;
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void;
	onClose?: () => void;
}

interface ModalState {
	modals: ModalConfig[];
	activeModal: ModalConfig | null;
}

const initialState: ModalState = {
	modals: [],
	activeModal: null
};

function createModalStore() {
	const { subscribe, set, update } = writable<ModalState>(initialState);

	return {
		subscribe,
		
		// Open a modal
		open: (config: Omit<ModalConfig, 'id'> & { id?: string }) => {
			const id = config.id || `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			const modalConfig: ModalConfig = { ...config, id };
			
			update(state => ({
				...state,
				modals: [...state.modals, modalConfig],
				activeModal: modalConfig
			}));
			
			return id;
		},
		
		// Close a specific modal by ID
		close: (id: string) => {
			update(state => {
				const modals = state.modals.filter(modal => modal.id !== id);
				const activeModal = modals.length > 0 ? modals[modals.length - 1] : null;
				
				// Call onClose callback if it exists
				const closingModal = state.modals.find(modal => modal.id === id);
				if (typeof window !== 'undefined' && closingModal?.onClose) {
					closingModal.onClose();
				}
				
				return {
					...state,
					modals,
					activeModal
				};
			});
		},
		
		// Close the currently active modal
		closeCurrent: () => {
			update(state => {
				if (state.activeModal) {
					const modals = state.modals.filter(modal => modal.id !== state.activeModal!.id);
					const activeModal = modals.length > 0 ? modals[modals.length - 1] : null;
					
					// Call onClose callback if it exists
					if (typeof window !== 'undefined' && state.activeModal.onClose) {
						state.activeModal.onClose();
					}
					
					return {
						...state,
						modals,
						activeModal
					};
				}
				return state;
			});
		},
		
		// Close all modals
		closeAll: () => {
			update(state => {
				// Call onClose for all modals
				if (typeof window !== 'undefined') {
					state.modals.forEach(modal => {
						if (modal.onClose) {
							modal.onClose();
						}
					});
				}
				
				return {
					...state,
					modals: [],
					activeModal: null
				};
			});
		},
		
		// Confirm the current modal
		confirm: async () => {
			update(state => {
				if (typeof window !== 'undefined' && state.activeModal?.onConfirm) {
					const result = state.activeModal.onConfirm();
					if (result instanceof Promise) {
						result.then(() => {
							// Close modal after async confirmation
							modalStore.closeCurrent();
						});
					} else {
						// Close modal immediately for sync confirmation
						setTimeout(() => modalStore.closeCurrent(), 0);
					}
				}
				return state;
			});
		},
		
		// Cancel the current modal
		cancel: () => {
			update(state => {
				if (typeof window !== 'undefined' && state.activeModal?.onCancel) {
					state.activeModal.onCancel();
				}
				// Close the modal
				if (typeof window !== 'undefined') {
					setTimeout(() => modalStore.closeCurrent(), 0);
				}
				return state;
			});
		}
	};
}

export const modalStore = createModalStore();

// Helper functions for common modal types
export const modalHelpers = {
	// Confirmation modal
	confirm: (options: {
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'confirmation' | 'danger';
		onConfirm?: () => void | Promise<void>;
		onCancel?: () => void;
	}) => {
		return modalStore.open({
			title: options.title,
			content: options.message,
			variant: options.variant || 'confirmation',
			persistent: false,
			onConfirm: options.onConfirm,
			onCancel: options.onCancel
		});
	},
	
	// Alert modal
	alert: (options: {
		title: string;
		message: string;
		variant?: 'info' | 'success' | 'danger';
		onClose?: () => void;
	}) => {
		return modalStore.open({
			title: options.title,
			content: options.message,
			variant: options.variant || 'info',
			closeOnBackdrop: true,
			closeOnEscape: true,
			onClose: options.onClose
		});
	},
	
	// Custom component modal
	component: (options: {
		title?: string;
		component: any;
		props?: Record<string, any>;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		onClose?: () => void;
	}) => {
		return modalStore.open({
			title: options.title,
			component: options.component,
			props: options.props,
			size: options.size || 'md',
			onClose: options.onClose
		});
	}
};