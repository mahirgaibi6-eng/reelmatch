// Starts a transcription job with AssemblyAI. Receives raw audio bytes from
// the browser, uploads them to AssemblyAI, and kicks off a transcript job.
// Returns a job id immediately (transcription itself happens async, the
// frontend polls /api/transcribe-status to check progress).

export const config = {
  api: { bodyParser: false }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const KEY = process.env.ASSEMBLYAI_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY environment variable not set on the server.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST with the audio file as the raw body.' });
  }

  try {
    const audioBuffer = await readRawBody(req);
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data received.' });
    }

    // Step 1: upload the audio bytes to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: KEY },
      body: audioBuffer
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.upload_url) {
      return res.status(500).json({ error: 'Upload to AssemblyAI failed: ' + JSON.stringify(uploadData) });
    }

    // Step 2: start the transcription job
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ audio_url: uploadData.upload_url, language_detection: true })
    });
    const transcriptData = await transcriptRes.json();
    if (!transcriptRes.ok || !transcriptData.id) {
      return res.status(500).json({ error: 'Starting transcription failed: ' + JSON.stringify(transcriptData) });
    }

    res.status(200).json({ id: transcriptData.id });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
