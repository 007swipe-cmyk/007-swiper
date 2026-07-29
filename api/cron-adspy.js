import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

export const maxDuration = 60;

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAF94806dAwkSvPJSVHglfYMm9vE1Rnei4",
  authDomain: "swiper-db-21c6f.firebaseapp.com",
  projectId: "swiper-db-21c6f",
  storageBucket: "swiper-db-21c6f.firebasestorage.app",
  messagingSenderId: "235296129520",
  appId: "1:235296129520:web:612a9c5444064ce5b11d35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadToBunnyStream(videoUrl, libraryId, apiKey) {
  if (!videoUrl) return null;
  try {
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) return null;
    const arrayBuffer = await videoRes.arrayBuffer();

    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: "Ad_Facebook_" + Date.now() })
    });

    if (!createRes.ok) return null;
    const videoInfo = await createRes.json();
    const guid = videoInfo?.guid;
    if (!guid) return null;

    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: Buffer.from(arrayBuffer)
    });

    if (!uploadRes.ok) return null;
    return `https://vz-3e45a7a6-1ed.b-cdn.net/${guid}/play_720p.mp4`;
  } catch (error) {
    console.error("Erro Bunny Stream:", error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const API_TOKEN = process.env.VITE_APIFY_API_TOKEN;
  const APIFY_TASK_ID = process.env.APIFY_TASK_ID;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  
  const niche = req.query.niche || 'emagrecimento';

  if (!APIFY_TASK_ID || !API_TOKEN) {
    return res.status(500).json({ error: 'Configurações da Apify ausentes.' });
  }

  try {
    const apifyUrl = `https://api.apify.com/v2/acts/${APIFY_TASK_ID.replace('/', '~')}/run-sync-get-dataset-items?token=${API_TOKEN}`;
    
    const apifyReq = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=${encodeURIComponent(niche)}&media_type=all` }],
        maxAds: 50,
        maxItems: 50,
        resultsLimit: 50,
        proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] }
      })
    });

    if (!apifyReq.ok) {
      const errText = await apifyReq.text();
      return res.status(500).json({ error: `Apify API Error: ${apifyReq.status} - ${errText}` });
    }

    const rawItems = await apifyReq.json();
    const items = Array.isArray(rawItems) ? rawItems : (rawItems.items || []);
    const savedDocs = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        if (!item) continue;

        const videoUrl = 
          item.videoUrl || 
          item.video_url || 
          item.snapshot?.videos?.[0]?.videoHdUrl || 
          item.snapshot?.videos?.[0]?.videoSdUrl || 
          item.snapshot?.cards?.[0]?.videoHdUrl || 
          '';
        const imageUrl =
          item.imageUrl ||
          item.image_url ||
          item.snapshot?.images?.[0]?.originalImageUrl ||
          item.snapshot?.images?.[0] ||
          item.snapshot?.cards?.[0]?.original_image_url ||
          item.snapshot?.cards?.[0]?.resized_image_url ||
          '';

        const texto =
          item.bodyText ||
          item.adText ||
          item.text ||
          item.snapshot?.body?.text ||
          item.snapshot?.cards?.[0]?.body ||
          item.snapshot?.markup_card_doc?.body ||
          '';

        const nomeAnunciante =
          item.pageName ||
          item.page_name ||
          item.advertiserName ||
          item.snapshot?.page_name ||
          'Anunciante 007';

        const paginaDestino =
          item.pageUrl ||
          item.page_url ||
          item.destinationPage ||
          item.snapshot?.linkUrl ||
          item.snapshot?.cards?.[0]?.link_url ||
          '';

        let bunnyVideoUrl = '';
        if (videoUrl && libraryId && apiKey) {
          bunnyVideoUrl = await uploadToBunnyStream(videoUrl, libraryId, apiKey) || videoUrl;
        }

        const adId = String(item.adArchiveId || item.id || `ad_${i}_${Date.now()}`);

        const adDocument = {
          id: adId,
          videoUrl: bunnyVideoUrl,
          imageUrl: imageUrl,
          texto: texto,
          nomeAnunciante: nomeAnunciante,
          paginaDestino: paginaDestino,
          dataCaptura: new Date().toISOString(),
          nicho: niche
        };

        const docRef = await addDoc(collection(db, 'facebook_ads'), adDocument);
        savedDocs.push({ id: docRef.id, ...adDocument });
      } catch (itemErr) {
        console.error("Erro ao processar anúncio individual:", itemErr);
      }
    }

    return res.status(200).json({
      message: 'AdSpy Cron executed successfully',
      nicheExecuted: niche,
      adsFetched: items.length,
      adsSaved: savedDocs.length,
      savedDocs
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno de servidor' });
  }
}
