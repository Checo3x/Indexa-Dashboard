const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // URL de la API externa que deseas consumir
  const apiUrl = 'https://api.indexacapital.com${req.url.replace('/api', '')}';
  
  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        // Copia los headers necesarios, si los hay
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        // Agrega otras cabeceras si la API lo requiere, como Authorization
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    // Configura los encabezados para evitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Responde con los datos de la API
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con la API' });
  }
};
