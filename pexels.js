// This runs on the SERVER (Vercel), never in the user's browser.
// The Pexels API key lives only here, in an environment variable.

export default async function handler(req, res) {
  const KEY = process.env.PEXELS_API_KEY;

  if (!KEY) {
    return res.status(500).json({ error: 'PEXELS_API_KEY environment variable not set on the server.' });
  }

  const { type, q } = req.query;
  const query = encodeURIComponent((q || '').toString().slice(0, 100));

  let url;
  if (type === 'image') {
    url = `https://api.pexels.com/v1/search?query=${query}&per_page=12`;
  } else if (type === 'video') {
    url = `https://api.pexels.com/videos/search?query=${query}&per_page=12`;
  } else {
    return res.status(400).json({ error: 'Invalid type. Use "image" or "video".' });
  }

  try {
    const upstream = await fetch(url, { headers: { Authorization: KEY } });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Upstream request failed: ' + err.message });
  }
}
