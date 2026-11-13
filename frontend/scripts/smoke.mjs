const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const routes = [
  '/', '/city', '/campus', '/commons', '/discover', '/build',
  '/messages', '/profile', '/passport', '/login', '/signup',
];

for (const route of routes) {
  const response = await fetch(new URL(route, baseUrl), {
    headers: { accept: 'text/html' },
    redirect: 'manual',
  });
  if (response.status !== 200) {
    throw new Error(`Route ${route} returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`Route ${route} did not return HTML (${contentType})`);
  }
  console.log(`OK ${route}`);
}
