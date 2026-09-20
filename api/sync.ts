// Vercel Serverless Function for Walton SOP Multi-PC Sync
// Routes: GET /api/sync?userId=... and POST /api/sync?userId=...

// In-memory sync store (persists across warm serverless invocations)
const userDraftCache: Record<string, any> = {};

export default async function handler(req: any, res: any) {
  // Set CORS headers for multi-device/PC cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const userId = (req.query?.userId || req.body?.authorId || 'default').toString().trim();

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body) {
        userDraftCache[userId] = {
          ...body,
          _syncedAt: new Date().toISOString(),
        };
        return res.status(200).json({ success: true, doc: userDraftCache[userId] });
      }
      return res.status(400).json({ success: false, error: 'Empty payload' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'GET') {
    const doc = userDraftCache[userId] || null;
    return res.status(200).json({ success: true, doc });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
