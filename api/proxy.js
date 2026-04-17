const url = require('url');

function getAuthToken(req) {
  const header = req.headers.authorization || req.headers['x-auth-token'] || '';
  if (!header) return '';
  return String(header).replace(/^Bearer\s+/i, '').trim();
}

function getForwardedPath(req) {
  const parsedUrl = url.parse(req.url, true);
  const rawPath = parsedUrl.query.path || '';
  const path = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath);
  return `/${path.replace(/^\/+/, '')}`;
}

async function readUpstreamBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { body: await response.json(), contentType };
  }
  return { body: await response.text(), contentType };
}

module.exports = async (req, res) => {
  const apiPath = getForwardedPath(req);
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

    const upstreamHeaders = {
      Accept: 'application/json',
      'X-AUTH-TOKEN': token,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      upstreamHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: upstreamHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : undefined,
    });

    const { body, contentType } = await readUpstreamBody(response);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream API error',
        details: body,
      });
    }

    if (contentType.includes('application/json')) {
      return res.status(response.status).json(body);
    }

    res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8');
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
    });
  }
};
