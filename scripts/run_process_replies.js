(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/process-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual: true }),
    });

    console.log('STATUS', res.status);
    const text = await res.text();
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log(text);
    }
  } catch (err) {
    console.error('Request error:', err);
    process.exit(1);
  }
})();
