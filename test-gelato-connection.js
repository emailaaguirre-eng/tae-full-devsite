/**
 * Gelato API Connection Test
 * Run with: node test-gelato-connection.js
 * 
 * Make sure GELATO_API_KEY is set in your environment or .env.local
 */

require('dotenv').config({ path: '.env.local' });

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_API_URL = process.env.GELATO_API_URL || process.env.GELATO_API_BASE || 'https://order.gelatoapis.com/v4';

async function testGelatoConnection() {
  console.log('🔍 Testing Gelato API Connection...\n');
  console.log(`API URL: ${GELATO_API_URL}`);
  console.log(`API Key: ${GELATO_API_KEY ? `${GELATO_API_KEY.substring(0, 10)}...` : 'NOT SET'}\n`);

  if (!GELATO_API_KEY) {
    console.error('❌ GELATO_API_KEY is not set!');
    console.log('\nPlease set GELATO_API_KEY in your .env.local file:');
    console.log('GELATO_API_KEY=your-api-key-here');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Products List',
      endpoint: `${GELATO_API_URL}/products`,
      method: 'GET',
    },
    {
      name: 'Product Variants (Card)',
      endpoint: `${GELATO_API_URL}/products/cards_cl_dtc_prt_pt/variants`,
      method: 'GET',
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      console.log(`  Endpoint: ${test.endpoint}`);
      
      const response = await fetch(test.endpoint, {
        method: test.method,
        headers: {
          'X-API-KEY': GELATO_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : (data.variants ? data.variants.length : 1);
        console.log(`  ✅ ${test.name}: SUCCESS`);
        console.log(`     Response: ${Array.isArray(data) ? `${count} items` : 'Object received'}`);
        results.push({ name: test.name, success: true, status: response.status, data: count });
      } else {
        const errorText = await response.text();
        console.log(`  ❌ ${test.name}: FAILED`);
        console.log(`     Error: ${errorText.substring(0, 200)}`);
        results.push({ name: test.name, success: false, status: response.status, error: errorText.substring(0, 200) });
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: ERROR`);
      console.log(`     ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
    console.log('');
  }

  console.log('📊 Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  if (passed === results.length) {
    console.log('🎉 All tests passed! Gelato API connection is working.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check:');
    console.log('   1. GELATO_API_KEY is correct');
    console.log('   2. GELATO_API_URL is correct (should be https://order.gelatoapis.com/v4)');
    console.log('   3. API key has proper permissions');
    console.log('   4. Network connectivity to Gelato API');
    process.exit(1);
  }
}

testGelatoConnection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

