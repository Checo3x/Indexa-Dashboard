# Indexa Dashboard

Dashboard financiero para visualizar y analizar carteras de inversión de Indexa Capital de forma clara e interactiva.

## 🚀 Demo

👉 https://indexa-dashboard.vercel.app *(añade tu URL real aquí)*

---

## 📌 Overview

Esta aplicación permite explorar de forma visual el rendimiento y la composición de una cartera de inversión utilizando la API de Indexa Capital.

El usuario puede autenticarse con su token, seleccionar una cuenta y acceder a métricas clave junto con visualizaciones interactivas que facilitan el análisis financiero.

---

## ✨ Features

* 🔐 Autenticación mediante token de API
* 📊 Visualización del valor total de la cartera
* 📈 Evolución histórica y proyecciones (real, esperado, mejor y peor escenario)
* 🧩 Composición detallada de la cartera
* 📅 Histórico de rentabilidad
* ⚡ Carga progresiva de secciones para mejorar rendimiento
* 📱 Diseño responsive con TailwindCSS

---

## 🧱 Tech Stack

* **Frontend:** HTML5, JavaScript (ES6)
* **Visualización:** Chart.js
* **Estilos:** TailwindCSS
* **Datos:** Fetch API + Indexa Capital API
* **Deploy:** Vercel

---

## 🏗️ Arquitectura

La aplicación es un frontend puro que consume directamente la API de Indexa Capital:

* `/api/users/me` → listado de cuentas
* `/api/accounts/{id}/portfolio` → datos de cartera
* `/api/accounts/{id}/performance` → histórico y proyecciones

El estado se gestiona en el cliente y los datos se transforman para alimentar gráficos y tablas.

---

## ⚠️ Consideraciones de seguridad

Actualmente el token de API se envía en la cabecera:

Authorization: Bearer <token>

Este proyecto está pensado como demo/portfolio.
En un entorno productivo se recomienda:

* Implementar un backend intermedio (proxy)
* Evitar exponer tokens en el cliente
* Añadir control de sesiones/autenticación segura

---

## 📊 Funcionalidades principales

### Dashboard

* Valor total de la cartera
* Rentabilidad anual
* Volatilidad *(dependiente de la API)*

### Visualizaciones

* Evolución temporal de la cartera
* Escenarios proyectados
* Comparativa entre componentes

### Tablas

* Composición de activos
* Histórico de rendimiento

---

## 🛠️ Instalación local

```bash
git clone https://github.com/Checo3x/Indexa-Dashboard.git
cd Indexa-Dashboard
```

Abre `index.html` en tu navegador o usa un servidor local.

---

## 📈 Posibles mejoras

* Backend intermedio para gestionar autenticación
* Tests y linting
* Gestión de estado más estructurada
* Mejora de UX (loading states, errores)
* Exportación de datos

---

## 🐛 Known Issues

* La volatilidad depende de la API y actualmente puede ser 0
* Las proyecciones están sujetas al formato de datos recibido

---

## 📄 Licencia

MIT *(o la que quieras, pero pon una real)*

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.
Puedes abrir un issue o enviar un pull request.

---

## 📬 Contacto

Si tienes dudas o sugerencias, puedes abrir un issue en el repositorio.
