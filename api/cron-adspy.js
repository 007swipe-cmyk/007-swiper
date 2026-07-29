import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

// List of 30 Niches for automatic rotation
const NICHES_POOL = [
  // Português
  "emagrecimento",
  "renda extra",
  "relacionamento",
  "marketing digital",
  "investimentos",
  "beleza",
  "desenvolvimento pessoal",
  "saude",
  "idiomas",
  "produtividade",
  // Inglês
  "weight loss",
  "make money online",
  "dating tips",
  "digital marketing",
  "investing",
  "beauty products",
  "self improvement",
  "health tips",
  "learn english",
  "productivity hacks",
  // Espanhol
  "perdida de peso",
  "ganar dinero online",
  "consejos de citas",
  "marketing digital",
  "inversiones",
  "productos de belleza",
  "desarrollo personal",
  "consejos de salud",
  "aprender espanol",
  "consejos de productividad"
];

// Clean up ads older than 30 days
async function purgeOldAds(firestoreDb) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const adsRef = collection(firestoreDb, 'facebook_ads');
    const q = query(adsRef, where('dataCaptura', '<', thirtyDaysAgoIso));
    const querySnapshot = await getDocs(q);

    let deletedCount = 0;
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(firestoreDb, 'facebook_ads', docSnap.id));
      deletedCount++;
    }
    console.log(`[Purge] Deleted ${deletedCount} ads older than 30 days.`);
    return deletedCount;
  } catch (error) {
    console.error("[Purge] Error during database cleanup:", error);
    return 0;
  }
}

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

  const API_TOKEN = process.env.VITE_APIFY_API_TOKEN;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;

  // Global Niche Rotation & Fallback
  let niche = req.query.niche;
  if (!niche) {
    const randomIndex = Math.floor(Math.random() * NICHES_POOL.length);
    niche = NICHES_POOL[randomIndex];
  }

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
    // 1. Run database cleanup (Purge ads older than 30 days)
    const deletedCount = await purgeOldAds(db);

    // 2. Call Apify actor synchronous execution endpoint with a strict budget limit override payload
    const apifyUrl = `https://api.apify.com/v2/acts/${APIFY_TASK_ID.replace('/', '~')}/run-sync-get-dataset-items?token=${API_TOKEN}`;
    const apifyReq = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startUrls: [{ url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=${encodeURIComponent(niche)}&media_type=all` }],
        maxResult: 40,
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
    
    // Golden Rule cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    // Process items and upload videos to Bunny Stream sequentially
    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];

        // Regra de Ouro: Skip ads running for less than 7 days
        const startDateStr = item.startDate || item.start_date || item.snapshot?.creation_time || item.creationTime;
        if (startDateStr && new Date(startDateStr) > cutoffDate) continue;

        const videoUrl = item.videoUrl || item.video_url || item.snapshot?.videos?.[0]?.videoHdUrl || item.snapshot?.videos?.[0]?.videoSdUrl || '';
        const imageUrl = item.imageUrl || item.image_url || item.snapshot?.images?.[0]?.original_image_url || item.snapshot?.images?.[0]?.resized_image_url || '';
        const texto = item.bodyText || item.adText || item.text || '';

        // Skip ads without text, video and image/thumbnail to avoid saving garbage
        if (!videoUrl && !imageUrl && !texto) continue;

        let bunnyVideoUrl = '';
        if (videoUrl) {
          try {
            const uploadedUrl = await uploadToBunnyStream(videoUrl, libraryId, apiKey);
            if (uploadedUrl) {
              bunnyVideoUrl = uploadedUrl;
            }
          } catch (uploadErr) {
            console.error(`[Upload Bunny Stream] Failed at index ${i}:`, uploadErr);
          }
        }

        const adId = item.adArchiveId || item.id || `ad_${i}_${Date.now()}`;

        const adDocument = {
          id: adId,
          videoUrl: bunnyVideoUrl,
          imageUrl: imageUrl,
          texto: texto,
          nomeAnunciante: item.pageName || item.page_name || item.advertiserName || 'Anunciante',
          paginaDestino: item.pageUrl || item.page_url || item.destinationPage || item.snapshot?.linkUrl || '',
          dataCaptura: new Date().toISOString(),
          nicho: niche
        };

        const docRef = await addDoc(collection(db, 'facebook_ads'), adDocument);
        savedDocs.push({ id: docRef.id, ...adDocument });
      } catch (itemError) {
        console.error(`[Process Item Error] Failed to process item at index ${i}:`, itemError);
      }
    }

    return res.status(200).json({
      message: 'AdSpy Cron executed successfully',
      nicheExecuted: niche,
      adsFetched: items.length,
      adsProcessed: savedDocs.length,
      deletedOldAdsCount: deletedCount,
      savedDocs
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
