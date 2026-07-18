export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const API_TOKEN = process.env.VITE_APIFY_API_TOKEN;
  if (!API_TOKEN) return res.status(500).json({ error: 'Token Apify ausente no servidor Vercel.' });

  try {
    const apifyReq = await fetch(`https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await apifyReq.json();
    return res.status(apifyReq.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
