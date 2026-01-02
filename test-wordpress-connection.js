/**
 * Simple WordPress Connection Test
 * Run with: node test-wordpress-connection.js
 */

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 
               process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 
               'https://theartfulexperience.com';

async function testWordPressConnection() {
  console.log('🔍 Testing WordPress Connection...\n');
  console.log(`WordPress URL: ${WP_URL}\n`);

  const tests = [
    {
      name: 'REST API Base',
      endpoint: `${WP_URL}/wp-json`,
    },
    {
      name: 'Posts',
      endpoint: `${WP_URL}/wp-json/wp/v2/posts?per_page=1`,
    },
    {
      name: 'Pages',
      endpoint: `${WP_URL}/wp-json/wp/v2/pages?per_page=1`,
    },
    {
      name: 'Media Library',
      endpoint: `${WP_URL}/wp-json/wp/v2/media?per_page=1`,
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(test.endpoint, {
        headers: {
          'User-Agent': 'WordPress-Connection-Test/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 1;
        console.log(`  ✅ ${test.name}: SUCCESS (Status: ${response.status}, Items: ${count})`);
        results.push({ name: test.name, success: true, status: response.status });
      } else {
        console.log(`  ❌ ${test.name}: FAILED (Status: ${response.status})`);
        results.push({ name: test.name, success: false, status: response.status });
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }

  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  if (passed === results.length) {
    console.log('🎉 All tests passed! WordPress connection is working.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check your WordPress configuration.');
    process.exit(1);
  }
}

testWordPressConnection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

