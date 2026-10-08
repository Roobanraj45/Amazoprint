async function checkEndpoints() {
  const urls = [
    'http://localhost:9002/admin/addons',
    'http://localhost:9002/admin/products/1/variants/1/edit',
    'http://localhost:9002/design/premium-business-cards/start?subProductId=1'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`[${res.status}] ${url}`);
      if (res.status !== 200) {
        console.error(`Unexpected status ${res.status} for ${url}`);
      }
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e.message);
    }
  }
}

checkEndpoints().then(() => process.exit(0));
