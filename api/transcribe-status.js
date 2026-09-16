// Checks the status of a transcription job started by /api/transcribe-start.
// The frontend calls this repeatedly (every few seconds) until status is
// "completed" (or "error").

export default async function handler(req, res) {
  const KEY = process.env.ASSEMBLYAI_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY environment variable not set on the server.' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter.' });
  }

  try {
    const r = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: KEY }
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: 'Status check failed: ' + JSON.stringify(data) });
    }
    res.status(200).json({
      status: data.status,       // queued | processing | completed | error
      text: data.text || null,
      error: data.error || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
