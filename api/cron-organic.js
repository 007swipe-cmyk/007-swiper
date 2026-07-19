import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAF94806dAwkSvPJSVHglfYMm9vE1Rnei4",
  authDomain: "swiper-db-21c6f.firebaseapp.com",
  projectId: "swiper-db-21c6f",
  storageBucket: "swiper-db-21c6f.firebasestorage.app",
  messagingSenderId: "235296129520",
  appId: "1:235296129520:web:612a9c5444064ce5b11d35"
};

// Initialize Firebase client SDK in Serverless environment
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configurable Apify Actor ID
const APIFY_ACTOR_ID = 'id_do_actor_aqui';

function formatViews(num) {
  if (!num) return '0';
  const val = parseInt(num, 10);
  if (isNaN(val)) return String(num);
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(val);
}

export default async function handler(req, res) {
  // Allow GET from Vercel Crons, and POST for manual trigger tests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Security checks: Validate Vercel standard cron header OR query param bypass
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const bypassParam = req.query.bypass === '007spy';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !bypassParam) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
  }

  const API_TOKEN = process.env.VITE_APIFY_API_TOKEN;
  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Token Apify VITE_APIFY_API_TOKEN ausente no servidor.' });
  }

  try {
    // Call Apify actor synchronously to pull scraped search items
    const apifyReq = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 10,
        ...req.body
      })
    });

    if (!apifyReq.ok) {
      const errText = await apifyReq.text();
      throw new Error(`Apify API Error: ${apifyReq.status} - ${errText}`);
    }

    const data = await apifyReq.json();
    const items = Array.isArray(data) ? data : (data.items || []);

    const formattedHooks = items.map((item) => {
      const videoUrl = item.videoUrl || item.webVideoUrl || item.shareUrl || item.url || '';
      
      let plataforma = 'TikTok';
      if (videoUrl.includes('instagram.com')) plataforma = 'Reels';
      else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) plataforma = 'Shorts';

      const rawViews = item.playCount || item.views || item.viewCount || 0;
      const visualizacoes = formatViews(rawViews);

      let nicho = 'Geral';
      if (item.hashtags && item.hashtags.length > 0) {
        nicho = item.hashtags[0].name || item.hashtags[0] || 'Geral';
      } else if (item.niche) {
        nicho = item.niche;
      }

      let gancho = 'CURIOSIDADE';
      if (item.hook) {
        gancho = item.hook.toUpperCase();
      } else if (item.gancho) {
        gancho = item.gancho.toUpperCase();
      }

      return {
        plataforma,
        nicho,
        linkVideo: videoUrl,
        visualizacoes,
        gancho
      };
    }).filter(h => h.linkVideo);

    // Save formatted hooks to Firebase Firestore
    const savedDocs = [];
    for (const hook of formattedHooks) {
      const docRef = await addDoc(collection(db, 'organic_hooks'), hook);
      savedDocs.push({ id: docRef.id, ...hook });
    }

    return res.status(200).json({
      message: 'Cron executed successfully',
      hooksFetched: items.length,
      hooksSaved: savedDocs.length,
      savedDocs
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
