# Indexa-Dashboard

Este proyecto es un dashboard financiero desarrollado para visualizar y analizar los datos de carteras de inversión de Indexa Capital. La aplicación permite a los usuarios autenticarse mediante un token de API, seleccionar una cuenta, y explorar métricas clave como el valor total de la cartera, rentabilidad anual, volatilidad, y proyecciones de rendimiento (escenarios real, esperado, mejor y peor). Incluye gráficos interactivos y tablas para mostrar la evolución de la cartera, su composición y el histórico de rentabilidad.

El dashboard está construido con tecnologías web modernas (HTML, JavaScript, Chart.js y TailwindCSS) y utiliza la API de Indexa Capital para obtener los datos financieros. La interfaz es intuitiva y permite una carga progresiva de las secciones para mejorar la experiencia de usuario.

# Características
  Autenticación segura: Introduce un token de API (oculto en un campo de tipo password) para acceder a los datos.
  Selección de cuentas: Permite elegir entre las cuentas asociadas al usuario.
  Métricas clave:
  Valor total de la cartera.
  Rentabilidad anual.
  Volatilidad (preparado para datos futuros).
  Dinero adicional necesario para operar.
  Gráficos interactivos:
  Evolución total de la cartera con líneas para escenarios real, esperado, mejor y peor.
  Evolución de los componentes individuales de la cartera.
  Tablas detalladas:
  Composición de la cartera con fondos, valores y pesos.
  Histórico de rentabilidad con fechas, valores y porcentajes.
  Carga progresiva: Las secciones (gráficos, tablas) se expanden bajo demanda para mejorar el rendimiento.
  Rango de fechas dinámico: Muestra datos desde 5 meses atrás hasta 5 meses en el futuro (basado en la fecha actual: 21 de abril de 2025).
# Tecnologías utilizadas
  HTML5: Estructura de la interfaz.
  JavaScript (ES6): Lógica del frontend y manejo de datos.
  Chart.js: Para los gráficos interactivos.
  TailwindCSS: Estilos y diseño responsivo.
  Fetch API: Comunicación con la API de Indexa Capital.
  Vercel: Despliegue y hosting de la aplicación.

# Accede a la aplicación:
Abre la URL de Vercel o el servidor local en tu navegador.
Introduce el token de API:
Ingresa tu token de Indexa Capital en el campo "Token de API". Este campo es de tipo password para mayor seguridad, y el token se limpia automáticamente tras usarlo.
Carga las cuentas:
Haz clic en "Cargar Cuentas" para obtener la lista de cuentas asociadas al usuario.
Selecciona una cuenta:
Elige una cuenta del menú desplegable y haz clic en "Obtener Datos".
Explora los datos:
Información de la Cuenta: Verás métricas clave como el valor total, rentabilidad anual, volatilidad y dinero adicional necesario.
Usa los botones "Mostrar Gráficos", "Mostrar Composición" y "Mostrar Histórico" para expandir las secciones correspondientes.

# API de Indexa Capital
La aplicación utiliza dos endpoints principales de la API de Indexa Capital:

/api/users/me: Obtiene la lista de cuentas del usuario.
/api/accounts/{accountId}/portfolio: Obtiene los datos de la cartera (valor total, composición, etc.).
/api/accounts/{accountId}/performance: Obtiene datos históricos y proyecciones (rendimiento real, esperado, mejor y peor).
Nota: Asegúrate de tener un token de API válido. La aplicación no encripta el token antes de enviarlo a la API (se envía en texto plano en las cabeceras Authorization: Bearer <token>). Para mayor seguridad, considera implementar un mecanismo de autenticación más robusto en la API.

Contribuciones
Haz un fork del repositorio.
Crea una rama para tu feature:
bash


git checkout -b feature/nueva-funcionalidad
Realiza tus cambios y haz commit:
bash


git commit -m "Añade nueva funcionalidad"
Sube los cambios a tu fork:
bash


git push origin feature/nueva-funcionalidad
Crea un Pull Request en GitHub.

# Problemas conocidos
  Volatilidad estática: Actualmente, la API devuelve un valor de volatilidad de 0. El campo está preparado para mostrar datos futuros si la API los proporciona.
  Proyecciones acumulativas: Las proyecciones (esperado, mejor, peor) se calculan acumulativamente mes a mes. Si la API cambia el formato de los factores de retorno, el cálculo podría necesitar ajustes.
  Licencia
  Este proyecto está licenciado bajo la . Siéntete libre de usarlo y modificarlo según tus necesidades.

Contacto
Si tienes preguntas o sugerencias, no dudes en abrir un issue en este repositorio o contactarme directamente.
