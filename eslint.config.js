import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import prettier from 'eslint-config-prettier'

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,ts,svelte}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				extraFileExtensions: ['.svelte']
			},
			globals: {
				console: 'readonly',
				process: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...ts.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'no-console': 'warn',
			'no-debugger': 'error',
			'prefer-const': 'error',
			'no-var': 'error'
		}
	},
	{
		files: ['static/sw.js'],
		languageOptions: {
			globals: {
				self: 'readonly',
				caches: 'readonly',
				fetch: 'readonly',
				clients: 'readonly',
				console: 'readonly'
			}
		},
		rules: {
			'no-console': 'off'
		}
	},
	{
		files: ['test/**/*.js'],
		languageOptions: {
			globals: {
				console: 'readonly',
				process: 'readonly'
			}
		},
		rules: {
			'no-console': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			}
		},
		plugins: {
			svelte
		},
		rules: {
			...svelte.configs.recommended.rules,
			'svelte/no-at-html-tags': 'error',
			'svelte/no-target-blank': 'error'
		}
	},
	prettier,
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/', '*.cjs']
	}
]
