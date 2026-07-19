import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

export const maxDuration = 60; // Max execution duration for Vercel Hobby plan

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

// Download video buffer from Facebook and upload to Bunny.net Storage
async function uploadToBunny(videoUrl, adId, index, storageZone, apiKey) {
  try {
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      console.warn(`Failed to fetch video from ${videoUrl}: ${videoRes.statusText}`);
      return null;
    }
    const arrayBuffer = await videoRes.arrayBuffer();

    const fileName = `ad_${adId || Date.now()}_${index}.mp4`;
    const bunnyUrl = `https://storage.bunnycdn.com/${storageZone}/${fileName}`;

    const uploadRes = await fetch(bunnyUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: Buffer.from(arrayBuffer)
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`Bunny upload failed: ${uploadRes.status} - ${errText}`);
      return null;
    }

    return `https://${storageZone}.b-cdn.net/${fileName}`;
  } catch (error) {
    console.error(`Error uploading video for ad ${adId}:`, error);
    return null;
  }
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
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_API_KEY;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Token Apify VITE_APIFY_API_TOKEN ausente no servidor.' });
  }
  if (!storageZone || !apiKey) {
    return res.status(500).json({ error: 'Configurações do Bunny.net ausentes (BUNNY_STORAGE_ZONE ou BUNNY_API_KEY).' });
  }

  try {
    const startUrl = "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&search_type=keyword_unordered&q=truque";

    const payload = {
      startUrls: [{ url: startUrl }],
      searchTerms: ["truque"],
      country: "BR",
      activeStatus: "active",
      maxItems: 10 // Limit maximum items fetched to avoid 60s function timeout
    };

    // Call Apify actor synchronously
    const apifyReq = await fetch("https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=" + API_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apifyReq.ok) {
      const errText = await apifyReq.text();
      throw new Error(`Apify API Error: ${apifyReq.status} - ${errText}`);
    }

    const rawItems = await apifyReq.json();
    const items = Array.isArray(rawItems) ? rawItems : (rawItems.items || []);

    const savedDocs = [];
    
    // Process items and upload videos to Bunny.net Storage sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const videoUrl = item.videoUrl || item.video_url || item.snapshot?.videos?.[0]?.videoHdUrl || item.snapshot?.videos?.[0]?.videoSdUrl || '';
      
      if (!videoUrl) continue; // Skip items without videos

      const adId = item.adArchiveId || item.id || `ad_${i}_${Date.now()}`;
      
      // Upload raw video buffer to Bunny CDN
      const bunnyVideoUrl = await uploadToBunny(videoUrl, adId, i, storageZone, apiKey);
      if (!bunnyVideoUrl) continue;

      const adDocument = {
        nomeAnunciante: item.pageName || item.page_name || item.advertiserName || 'Anunciante',
        textoAnuncio: item.bodyText || item.adText || item.text || '',
        videoUrl: bunnyVideoUrl, // Use the Bunny CDN URL, never direct Facebook CDN
        paginaDestino: item.pageUrl || item.page_url || item.destinationPage || item.snapshot?.linkUrl || '',
        dataCaptura: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'facebook_ads'), adDocument);
      savedDocs.push({ id: docRef.id, ...adDocument });
    }

    return res.status(200).json({
      message: 'AdSpy Cron executed successfully',
      adsFetched: items.length,
      adsProcessedWithVideo: savedDocs.length,
      savedDocs
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
