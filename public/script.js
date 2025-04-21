// Configuración de Chart.js
let portfolioChart = null;
let componentsChart = null;
const ctxPortfolio = document.getElementById('portfolio-chart')?.getContext('2d');
const ctxComponents = document.getElementById('components-chart')?.getContext('2d');

if (typeof Chart === 'undefined') {
    console.error('Chart.js no está cargado');
    setError('Error: No se pudo cargar la librería de gráficos. Por favor, revisa tu conexión o la configuración.');
}

// Paleta de colores predefinida para los fondos y líneas del gráfico
const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'
];

const performanceColors = {
    real: '#4ECDC4',
    expected: '#3498DB',
    best: '#2ECC71',
    worst: '#E74C3C'
};

function createPortfolioChart(labels, datasets) {
    if (!labels.length || !datasets.length) {
        setWarning('No hay suficientes datos históricos para mostrar todas las líneas en el gráfico total.');
        return;
    }
    if (!ctxPortfolio) {
        console.error('Contexto del canvas (portfolio-chart) no encontrado');
        return;
    }
    try {
        if (portfolioChart) portfolioChart.destroy();
        portfolioChart = new Chart(ctxPortfolio, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Fecha' }, ticks: { maxTicksLimit: 10 } },
                    y: { title: { display: true, text: 'Valor (€)' }, beginAtZero: false }
                },
                plugins: { legend: { display: true, position: 'top' } }
            }
        });
    } catch (error) {
        console.error('Error al crear el gráfico total:', error);
        setError('No se pudo renderizar el gráfico total. Por favor, revisa la consola para más detalles.');
    }
}

function createComponentsChart(labels, datasets) {
    if (!labels.length || !datasets.length) {
        setWarning('No hay suficientes datos para mostrar todas las líneas en el gráfico de componentes.');
        return;
    }
    if (!ctxComponents) {
        console.error('Contexto del canvas (components-chart) no encontrado');
        return;
    }
    try {
        if (componentsChart) componentsChart.destroy();
        componentsChart = new Chart(ctxComponents, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Fecha' }, ticks: { maxTicksLimit: 10 } },
                    y: { title: { display: true, text: 'Valor (€)' }, beginAtZero: false }
                },
                plugins: { legend: { display: true, position: 'top' } }
            }
        });
    } catch (error) {
        console.error('Error al crear el gráfico de componentes:', error);
        setError('No se pudo renderizar el gráfico de componentes. Por favor, revisa la consola para más detalles.');
    }
}

// Aquí continuarías incluyendo el resto del código, pero sin duplicar bloques ni líneas incorrectas.
// Se eliminó la línea inválida: document.getElement periods.length).fill(null);
// También se suprimieron los bloques duplicados.
