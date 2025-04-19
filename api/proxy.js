const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Construye la URL de la API de Indexa Capital
  const apiUrl = `https://api.indexacapital.com${req.url.replace('/api', '')}`;
  
  // Manejo de solicitudes CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  try {
    console.log('Proxy request:', { method: req.method, url: apiUrl, headers: req.headers });
    
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    console.log('Proxy response:', { status: response.status, data });

    // Configura encabezados CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Devuelve la respuesta de la API
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message, error.stack);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
