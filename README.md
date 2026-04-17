# Indexa Dashboard

Dashboard financiero para analizar carteras de inversión de Indexa Capital con una interfaz clara, visual e interactiva.

## Demo

Añade aquí la URL pública del despliegue.

## Qué hace

- Autenticación mediante token de API
- Selección de cuentas del usuario
- Resumen global de cartera
- Evolución histórica y escenarios proyectados
- Composición por activos
- Histórico reciente de rentabilidad
- Exportación de datos a CSV

## Stack

- HTML5
- JavaScript (ES6)
- Chart.js
- CSS personalizado
- Vercel

## Estructura del proyecto

- `public/index.html`: interfaz principal
- `public/script.js`: lógica de datos, gráficos y estado
- `public/styles.css`: estilos y responsive layout
- `api/proxy.js`: proxy serverless hacia la API de Indexa Capital
- `vercel.json`: rewrites y runtime

## Seguridad

El proyecto está planteado como demo/portfolio. El token se envía al proxy para acceder a la API, pero no existe todavía una capa de autenticación de usuario final ni almacenamiento seguro de credenciales.

Para un entorno productivo conviene añadir:

- backend intermedio con control de sesión
- gestión segura de credenciales
- validación y rate limiting

## Instalación local

```bash
git clone https://github.com/Checo3x/Indexa-Dashboard.git
cd Indexa-Dashboard
npm install
npm run dev
```

## Mejoras aplicadas

- Proxies y headers simplificados
- Lógica de datos separada en funciones reutilizables
- Gráficos con fábrica común
- Estados de carga, error y vacío más claros
- CSS más limpio y consistente

## Licencia

MIT
