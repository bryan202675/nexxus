const fetch = require('node-fetch');
async function run() {
  const res = await fetch('http://127.0.0.1:5001/nexxus-firebase-project/us-central1/askNexxusAI', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { prompt: "agenda una reunión para mañana" } })
  });
  console.log(await res.text());
}
run();
