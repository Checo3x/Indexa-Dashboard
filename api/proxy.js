const url = require('url');

function getAuthToken(req) {
  const header = req.headers.authorization || req.headers['x-auth-token'] || '';
  if (!header) return '';
  return String(header).replace(/^Bearer\s+/i, '').trim();
}

module.exports = async (req, res) => {
  const parsedUrl = url.parse(req.url);
  const apiPath = (parsedUrl.pathname || '').replace('/api', '');
  const apiUrl = `https://api.indexacapital.com${apiPath}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-AUTH-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-AUTH-TOKEN': token,
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream API error',
        details: typeof payload === 'object' ? payload : String(payload),
      });
    }

    return res.status(response.status).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
    });
  }
};
