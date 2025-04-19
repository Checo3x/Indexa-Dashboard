const url = require('url');

module.exports = async (req, res) => {
  // Parsear la URL para obtener solo la ruta, sin parámetros de consulta
  const parsedUrl = url.parse(req.url);
  const cleanPath = parsedUrl.pathname;
  const apiPath = cleanPath.replace('/api', '');

  // Usa el endpoint base correcto (sin /v1)
  const apiUrl = `https://api.indexacapital.com${apiPath}`;
  
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

    console.log('Fetch response status:', response.status, response.statusText);

    // Verificar si la solicitud fue exitosa
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Non-OK response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API responded with ${response.status}: ${errorText}`);
    }

    // Verificar si la respuesta es JSON
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      console.log('Non-JSON response:', data);
      throw new Error('Expected JSON response, but got: ' + data);
    }

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
