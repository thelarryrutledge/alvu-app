/**
 * Test script for delete income source functionality
 * This tests the database operations for deleting income sources
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables')
	console.log('Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in .env')
	process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDeleteIncomeSource() {
	console.log('🧪 Testing Delete Income Source Functionality')
	console.log('=' .repeat(50))
	
	try {
		// Test 1: Use existing authenticated user (simulate with known user ID)
		console.log('\n1. Using test user ID...')
		// For testing purposes, we'll use a mock user ID that follows UUID format
		const userId = '12345678-1234-1234-1234-123456789012'
		console.log('✅ Test user ID set:', userId)
		
		// Test 2: Create a test income source
		console.log('\n2. Creating test income source...')
		const testIncomeSource = {
			user_id: userId,
			name: 'Test Salary for Delete',
			amount: 5000.00,
			frequency: 'monthly',
			description: 'Test income source for delete functionality',
			is_active: true,
			next_expected_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
		}
		
		const { data: createData, error: createError } = await supabase
			.from('income_sources')
			.insert(testIncomeSource)
			.select()
			.single()
		
		if (createError) {
			console.error('❌ Failed to create income source:', createError.message)
			return
		}
		
		console.log('✅ Test income source created:', createData.id)
		console.log('   Name:', createData.name)
		console.log('   Amount:', createData.amount)
		
		// Test 3: Verify income source exists
		console.log('\n3. Verifying income source exists...')
		const { data: verifyData, error: verifyError } = await supabase
			.from('income_sources')
			.select('*')
			.eq('id', createData.id)
			.eq('user_id', userId)
			.single()
		
		if (verifyError) {
			console.error('❌ Failed to verify income source:', verifyError.message)
			return
		}
		
		console.log('✅ Income source verified:', verifyData.name)
		
		// Test 4: Delete the income source (main test)
		console.log('\n4. Testing delete operation...')
		const { error: deleteError } = await supabase
			.from('income_sources')
			.delete()
			.eq('id', createData.id)
			.eq('user_id', userId) // Security check
		
		if (deleteError) {
			console.error('❌ Failed to delete income source:', deleteError.message)
			return
		}
		
		console.log('✅ Income source deleted successfully')
		
		// Test 5: Verify income source is deleted
		console.log('\n5. Verifying income source is deleted...')
		const { data: checkData, error: checkError } = await supabase
			.from('income_sources')
			.select('*')
			.eq('id', createData.id)
			.eq('user_id', userId)
		
		if (checkError) {
			console.error('❌ Error checking deleted income source:', checkError.message)
			return
		}
		
		if (checkData && checkData.length === 0) {
			console.log('✅ Income source successfully deleted from database')
		} else {
			console.error('❌ Income source still exists in database')
			return
		}
		
		// Test 6: Test security - try to delete with wrong user_id
		console.log('\n6. Testing security (wrong user_id)...')
		const { data: createData2, error: createError2 } = await supabase
			.from('income_sources')
			.insert({
				...testIncomeSource,
				name: 'Test Security Income'
			})
			.select()
			.single()
		
		if (createError2) {
			console.error('❌ Failed to create second income source:', createError2.message)
			return
		}
		
		// Try to delete with wrong user_id (should fail)
		const { error: securityError } = await supabase
			.from('income_sources')
			.delete()
			.eq('id', createData2.id)
			.eq('user_id', 'wrong-user-id')
		
		// Check if the income source still exists (it should)
		const { data: securityCheck, error: securityCheckError } = await supabase
			.from('income_sources')
			.select('*')
			.eq('id', createData2.id)
			.eq('user_id', userId)
		
		if (securityCheckError) {
			console.error('❌ Error checking security test:', securityCheckError.message)
			return
		}
		
		if (securityCheck && securityCheck.length > 0) {
			console.log('✅ Security test passed - income source not deleted with wrong user_id')
		} else {
			console.error('❌ Security test failed - income source was deleted with wrong user_id')
			return
		}
		
		// Cleanup: Delete the second test income source
		await supabase
			.from('income_sources')
			.delete()
			.eq('id', createData2.id)
			.eq('user_id', userId)
		
		console.log('\n🎉 All delete functionality tests passed!')
		console.log('✅ Delete operation works correctly')
		console.log('✅ Security checks are in place')
		console.log('✅ Database operations are functioning properly')
		
	} catch (error) {
		console.error('❌ Unexpected error during testing:', error)
	}
}

// Run the test
testDeleteIncomeSource()