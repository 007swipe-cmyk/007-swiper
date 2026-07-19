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

// Configurable Apify Task ID
const APIFY_TASK_ID = process.env.APIFY_TASK_ID;

// Create video on Bunny Stream and upload the video buffer
async function uploadToBunnyStream(videoUrl, libraryId, apiKey) {
  try {
    // 1. Download video buffer from Facebook
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      console.warn(`Failed to fetch video from ${videoUrl}: ${videoRes.statusText}`);
      return null;
    }
    const arrayBuffer = await videoRes.arrayBuffer();

    // 2. Step 1: Create Video Entry on Bunny Stream
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: "Ad_Facebook_" + Date.now() })
    });

    if (!createRes.ok) {
      const createErr = await createRes.text();
      console.error(`Bunny Stream create video entry failed: ${createRes.status} - ${createErr}`);
      return null;
    }

    const videoInfo = await createRes.json();
    const guid = videoInfo.guid;
    if (!guid) {
      console.error("Bunny Stream did not return a video guid.");
      return null;
    }

    // 3. Step 2: Upload Video Buffer
    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: Buffer.from(arrayBuffer)
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      console.error(`Bunny Stream upload video buffer failed: ${uploadRes.status} - ${uploadErr}`);
      return null;
    }

    // Return the formatted Bunny Stream video Pull Zone CDN URL
    return `https://vz-3e45a7a6-1ed.b-cdn.net/${guid}/play_720p.mp4`;
  } catch (error) {
    console.error("Error uploading video to Bunny Stream:", error);
    return null;
  }
}

export default async function handler(req, res) {
  // Allow GET from Vercel Crons, and POST for manual trigger tests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Security checks: Validate Vercel standard cron header OR query param bypass (Temporarily disabled for manual testing)
  // const authHeader = req.headers.authorization;
  // const cronSecret = process.env.CRON_SECRET;
  // const bypassParam = req.query.bypass === '007spy';

  // const expectedToken = `Bearer ${cronSecret}`;
  // if (cronSecret && authHeader !== expectedToken && authHeader !== cronSecret && !bypassParam) {
  //   return res.status(401).end();
  // }

  const API_TOKEN = process.env.VITE_APIFY_API_TOKEN;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  const niche = req.query.niche || 'truque';

  if (!APIFY_TASK_ID) {
    return res.status(500).json({ error: 'Erro: APIFY_TASK_ID do Actor não configurado. Execução abortada para prevenção de custos.' });
  }
  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Token Apify VITE_APIFY_API_TOKEN ausente no servidor.' });
  }
  if (!libraryId || !apiKey) {
    return res.status(500).json({ error: 'Configurações do Bunny.net ausentes (BUNNY_LIBRARY_ID ou BUNNY_API_KEY).' });
  }

  try {
    // FORCE SAVE TEST DOCUMENT FOR FB INTEGRATION
    await addDoc(collection(db, 'facebook_ads'), {
      id: 'test_id_' + Date.now(),
      texto: `anúncio de teste (${niche})`,
      nomeAnunciante: 'Anunciante de Teste',
      videoUrl: '',
      dataCaptura: new Date().toISOString(),
      nicho: niche
    });

    // Call Apify actor synchronous execution endpoint with a strict budget limit override payload
    const apifyUrl = `https://api.apify.com/v2/acts/${APIFY_TASK_ID.replace('/', '~')}/run-sync-get-dataset-items?token=${API_TOKEN}`;
    const apifyReq = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startUrls: [{ url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=${encodeURIComponent(niche)}&media_type=all` }],
        maxResult: 10,
        proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] }
      })
    });

    if (!apifyReq.ok) {
      const errText = await apifyReq.text();
      throw new Error(`Apify API Error: ${apifyReq.status} - ${errText}`);
    }

    const rawItems = await apifyReq.json();
    const items = Array.isArray(rawItems) ? rawItems : (rawItems.items || []);

    const savedDocs = [];
    
    // Process items and upload videos to Bunny Stream sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const videoUrl = item.videoUrl || item.video_url || item.snapshot?.videos?.[0]?.videoHdUrl || item.snapshot?.videos?.[0]?.videoSdUrl || '';
      
      // TEMPORARILY DISABLED: Skip items without videos check
      // if (!videoUrl) continue;
 
      const adId = item.adArchiveId || item.id || `ad_${i}_${Date.now()}`;
      
      // TEMPORARILY DISABLED: Upload video to Bunny Stream check
      // const bunnyVideoUrl = await uploadToBunnyStream(videoUrl, libraryId, apiKey);
      // if (!bunnyVideoUrl) continue;
      const bunnyVideoUrl = videoUrl || '';

      const adDocument = {
        id: adId,
        videoUrl: bunnyVideoUrl,
        texto: item.bodyText || item.adText || item.text || '',
        nomeAnunciante: item.pageName || item.page_name || item.advertiserName || 'Anunciante',
        paginaDestino: item.pageUrl || item.page_url || item.destinationPage || item.snapshot?.linkUrl || '',
        dataCaptura: new Date().toISOString(),
        nicho: niche
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
