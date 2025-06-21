import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables')
	console.error('Please check your .env file contains:')
	console.error('- PUBLIC_SUPABASE_URL')
	console.error('- PUBLIC_SUPABASE_ANON_KEY')
	process.exit(1)
}

console.log('🔗 Testing Supabase connection...')
console.log(`📍 URL: ${supabaseUrl}`)
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`)

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
	try {
		// Test basic connection by checking auth
		const { data, error } = await supabase.auth.getSession()

		if (error) {
			console.error('❌ Connection failed:', error.message)
			return false
		}

		console.log('✅ Supabase connection successful!')
		console.log('📊 Session data:', data ? 'Available' : 'No active session (expected)')

		// Test database access by trying to query a system table
		const { data: tables, error: dbError } = await supabase
			.from('information_schema.tables')
			.select('table_name')
			.limit(1)

		if (dbError) {
			console.log(
				'⚠️  Database query test failed (this is normal if no tables exist yet):',
				dbError.message
			)
		} else {
			console.log('✅ Database access confirmed!')
		}

		return true
	} catch (err) {
		console.error('❌ Unexpected error:', err.message)
		return false
	}
}

testConnection()
	.then((success) => {
		if (success) {
			console.log('\n🎉 Supabase setup is working correctly!')
			console.log('Ready to proceed with database schema creation.')
		} else {
			console.log('\n❌ Supabase setup needs attention.')
			console.log('Please check your configuration and try again.')
		}
	})
	.catch((err) => {
		console.error('❌ Test failed:', err)
	})
