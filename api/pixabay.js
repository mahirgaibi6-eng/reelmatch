export default async function handler(req, res) {
  const KEY = process.env.PIXABAY_API_KEY;

  if (!KEY) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY environment variable not set on the server.' });
  }

  const { type, q } = req.query;
  const query = encodeURIComponent((q || '').toString().slice(0, 100));

  let url;
  if (type === 'image') {
    url = `https://pixabay.com/api/?key=${KEY}&q=${query}&image_type=photo&per_page=12&safesearch=true`;
  } else if (type === 'video') {
    url = `https://pixabay.com/api/videos/?key=${KEY}&q=${query}&per_page=12&safesearch=true`;
  } else {
    return res.status(400).json({ error: 'Invalid type. Use "image" or "video".' });
  }

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Upstream request failed: ' + err.message });
  }
}
