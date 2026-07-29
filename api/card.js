function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function createSeed(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits) {
    return Number(digits.slice(0, 8)) || 20260729;
  }

  return 20260729;
}

function buildPrompt(body) {
  const signName = body?.sign?.name || 'zodiac';
  const element = body?.sign?.element || 'cosmic';
  const traits = body?.sign?.traits || 'dreamy, mystical, premium';
  const numbers = Array.isArray(body?.numbers)
    ? body.numbers.map((item) => item.value).join(', ')
    : '';

  return [
    'A dreamy vertical zodiac card illustration, editorial and cinematic.',
    'Deep indigo night sky full of stars, fine constellation line art, and a glowing purple horizon.',
    'Silhouettes of tall pine trees framing the scene from the sides and bottom.',
    'Atmospheric, mystical, elegant, and premium, like a collectible astrology poster.',
    'No readable text, no watermark, no logo, no people.',
    `Zodiac sign mood: ${signName}. Element: ${element}. Traits: ${traits}.`,
    numbers ? `Lucky numbers to inspire subtle glowing clusters: ${numbers}.` : ''
  ].filter(Boolean).join(' ');
}

async function proxyToSegmind(payload) {
  const apiKey =
    process.env.SEGMIND_API_KEY ||
    process.env.HIGGSFIELD_API_KEY ||
    process.env.HIGGSFIELD_KEY ||
    payload.apiKey ||
    '';

  if (!apiKey) {
    throw new Error('Segmind API key is not configured on the server.');
  }

  const response = await fetch('https://api.segmind.com/v1/higgsfield-soul-2', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: '*/*'
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      aspect_ratio: '3:4',
      resolution: '1080p',
      seed: createSeed(payload.birthDate)
    })
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Segmind request failed: ${response.status} ${text}`);
  }

  if (contentType.includes('application/json')) {
    const text = await response.text();
    return { kind: 'json', body: text ? JSON.parse(text) : {} };
  }

  if (contentType.startsWith('image/')) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      kind: 'image',
      mimeType: contentType,
      base64Image: buffer.toString('base64')
    };
  }

  return {
    kind: 'text',
    body: await response.text()
  };
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'Not Found' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    const prompt = typeof body?.prompt === 'string' && body.prompt.trim()
      ? body.prompt.trim()
      : buildPrompt(body);

    const result = await proxyToSegmind({
      prompt,
      birthDate: body?.birthDate
    });

    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || 'Card generation failed.'
    });
  }
}

module.exports = handler;
