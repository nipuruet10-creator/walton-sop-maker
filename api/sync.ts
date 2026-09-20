// Vercel Serverless Function for Walton SOP Multi-PC Cloud Sync
// Supports:
// 1. Firebase Realtime Database (via FIREBASE_DATABASE_URL or query param)
// 2. Vercel KV / Upstash Redis (via KV_REST_API_URL & KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL)
// 3. In-memory fallback across warm serverless invocations

const memoryStore: {
  sops: Record<string, any>;
  drafts: Record<string, any>;
} = {
  sops: {},
  drafts: {},
};

export default async function handler(req: any, res: any) {
  // CORS configuration for cross-origin and multi-device access
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-cloud-sync-url'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Detect configured Cloud Database backends
  const customCloudUrl = (
    req.headers['x-cloud-sync-url'] ||
    req.query?.cloudUrl ||
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    ''
  ).toString().trim().replace(/\/$/, '');

  const kvRestUrl = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ''
  ).toString().trim().replace(/\/$/, '');

  const kvRestToken = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ''
  ).toString().trim();

  const action = (req.query?.action || req.body?.action || '').toString().trim();
  const userId = (req.query?.userId || req.body?.userId || req.body?.authorId || 'default').toString().trim();
  const sopId = (req.query?.id || req.body?.id || '').toString().trim();

  try {
    // ----------------------------------------------------
    // ACTION: testConnection
    // ----------------------------------------------------
    if (action === 'testConnection') {
      if (customCloudUrl && customCloudUrl.includes('firebaseio.com')) {
        try {
          const testRes = await fetch(`${customCloudUrl}/_test_ping.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ping: 'pong', time: new Date().toISOString() }),
          });
          if (testRes.ok) {
            return res.status(200).json({
              success: true,
              backend: 'firebase',
              message: 'Google Firebase Realtime Database সফলভাবে কানেক্ট হয়েছে!',
              url: customCloudUrl,
            });
          }
        } catch (e: any) {
          return res.status(500).json({ success: false, error: 'Firebase ping failed: ' + e.message });
        }
      }

      if (kvRestUrl && kvRestToken) {
        try {
          const testRes = await fetch(`${kvRestUrl}/set/walton_sop_ping`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvRestToken}` },
            body: JSON.stringify('pong'),
          });
          if (testRes.ok) {
            return res.status(200).json({
              success: true,
              backend: 'vercel_kv',
              message: 'Vercel KV / Upstash Redis ক্লাউড ডাটাবেজ সফলভাবে কানেক্ট হয়েছে!',
            });
          }
        } catch (e: any) {
          return res.status(500).json({ success: false, error: 'Vercel KV ping failed: ' + e.message });
        }
      }

      return res.status(200).json({
        success: true,
        backend: 'memory_relay',
        message: 'সার্ভারলেস মেমরি রিলে সচল আছে। স্থায়ী মাল্টি-পিসি সিঙ্কের জন্য Firebase বা Vercel KV কানেক্ট করুন।',
      });
    }

    // ----------------------------------------------------
    // ACTION: getAllSOPs
    // ----------------------------------------------------
    if (action === 'getAllSOPs' || (req.method === 'GET' && !action && !userId && !sopId)) {
      // 1. Check Firebase if configured
      if (customCloudUrl && customCloudUrl.includes('firebaseio.com')) {
        try {
          const fbRes = await fetch(`${customCloudUrl}/sops.json`);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && typeof fbData === 'object') {
              const list = Object.values(fbData).filter(Boolean);
              return res.status(200).json({ success: true, sops: list, source: 'firebase' });
            }
            return res.status(200).json({ success: true, sops: [], source: 'firebase' });
          }
        } catch (e) {
          console.warn('Firebase read error:', e);
        }
      }

      // 2. Check Vercel KV if configured
      if (kvRestUrl && kvRestToken) {
        try {
          const keysRes = await fetch(`${kvRestUrl}/keys/walton_sop_*`, {
            headers: { Authorization: `Bearer ${kvRestToken}` },
          });
          if (keysRes.ok) {
            const keysData = await keysRes.json();
            const keys: string[] = keysData.result || [];
            if (keys.length > 0) {
              const mgetRes = await fetch(`${kvRestUrl}/mget`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${kvRestToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(keys),
              });
              if (mgetRes.ok) {
                const mgetData = await mgetRes.json();
                const sops = (mgetData.result || [])
                  .map((item: any) => {
                    try {
                      return typeof item === 'string' ? JSON.parse(item) : item;
                    } catch {
                      return null;
                    }
                  })
                  .filter(Boolean);
                return res.status(200).json({ success: true, sops, source: 'vercel_kv' });
              }
            }
            return res.status(200).json({ success: true, sops: [], source: 'vercel_kv' });
          }
        } catch (e) {
          console.warn('Vercel KV read error:', e);
        }
      }

      // 3. Fallback to memory store
      const list = Object.values(memoryStore.sops);
      return res.status(200).json({ success: true, sops: list, source: 'memory' });
    }

    // ----------------------------------------------------
    // ACTION: saveSop
    // ----------------------------------------------------
    if (action === 'saveSop' || (req.method === 'POST' && req.body?.header)) {
      const doc = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const targetId = doc.id || sopId || `sop_${Date.now()}`;
      doc.id = targetId;
      doc._syncedAt = new Date().toISOString();

      // Always update memory store
      memoryStore.sops[targetId] = doc;
      if (doc.authorId) {
        memoryStore.drafts[doc.authorId] = doc;
      }

      // 1. Write to Firebase if configured
      if (customCloudUrl && customCloudUrl.includes('firebaseio.com')) {
        try {
          await fetch(`${customCloudUrl}/sops/${targetId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc),
          });
        } catch (e) {
          console.warn('Firebase saveSop error:', e);
        }
      }

      // 2. Write to Vercel KV if configured
      if (kvRestUrl && kvRestToken) {
        try {
          await fetch(`${kvRestUrl}/set/walton_sop_${targetId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvRestToken}` },
            body: JSON.stringify(doc),
          });
        } catch (e) {
          console.warn('Vercel KV saveSop error:', e);
        }
      }

      return res.status(200).json({ success: true, doc, id: targetId });
    }

    // ----------------------------------------------------
    // ACTION: deleteSop
    // ----------------------------------------------------
    if (action === 'deleteSop') {
      const targetId = sopId || req.query?.id;
      if (targetId) {
        delete memoryStore.sops[targetId];

        if (customCloudUrl && customCloudUrl.includes('firebaseio.com')) {
          try {
            await fetch(`${customCloudUrl}/sops/${targetId}.json`, { method: 'DELETE' });
          } catch {}
        }

        if (kvRestUrl && kvRestToken) {
          try {
            await fetch(`${kvRestUrl}/del/walton_sop_${targetId}`, {
              headers: { Authorization: `Bearer ${kvRestToken}` },
            });
          } catch {}
        }

        return res.status(200).json({ success: true, deletedId: targetId });
      }
    }

    // ----------------------------------------------------
    // ACTION: getDraft
    // ----------------------------------------------------
    if (action === 'getDraft' || (req.method === 'GET' && userId && userId !== 'default')) {
      // Check Firebase
      if (customCloudUrl && customCloudUrl.includes('firebaseio.com')) {
        try {
          const fbRes = await fetch(`${customCloudUrl}/drafts/${userId}.json`);
          if (fbRes.ok) {
            const fbDoc = await fbRes.json();
            if (fbDoc) return res.status(200).json({ success: true, doc: fbDoc, source: 'firebase' });
          }
        } catch {}
      }

      // Check Vercel KV
      if (kvRestUrl && kvRestToken) {
        try {
          const kvRes = await fetch(`${kvRestUrl}/get/walton_draft_${userId}`, {
            headers: { Authorization: `Bearer ${kvRestToken}` },
          });
          if (kvRes.ok) {
            const data = await kvRes.json();
            if (data.result) {
              const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
              return res.status(200).json({ success: true, doc: parsed, source: 'vercel_kv' });
            }
          }
        } catch {}
      }

      const doc = memoryStore.drafts[userId] || null;
      return res.status(200).json({ success: true, doc, source: 'memory' });
    }

    // ----------------------------------------------------
    // ACTION: saveDraft
    // ----------------------------------------------------
    if (action === 'saveDraft' || (req.method === 'POST' && userId)) {
      const doc = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (doc) {
        doc._syncedAt = new Date().toISOString();
        memoryStore.drafts[userId] = doc;

        if (customCloudUrl && customCloudUrl.includes('firebaseio.com')) {
          try {
            await fetch(`${customCloudUrl}/drafts/${userId}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(doc),
            });
          } catch {}
        }

        if (kvRestUrl && kvRestToken) {
          try {
            await fetch(`${kvRestUrl}/set/walton_draft_${userId}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${kvRestToken}` },
              body: JSON.stringify(doc),
            });
          } catch {}
        }

        return res.status(200).json({ success: true, doc });
      }
    }

    return res.status(200).json({ success: true, message: 'Sync endpoint active', storeSize: Object.keys(memoryStore.sops).length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
}
