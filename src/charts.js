import Chart from 'chart.js/auto';
import { setError, setWarning } from './utils.js';

const colorPalette = [
    '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'
];

const performanceColors = {
    real: '#4ECDC4',
    expected: '#3498DB',
    best: '#2ECC71',
    worst: '#E74C3C'
};

let portfolioChart = null;
let componentsChart = null;
const ctxPortfolio = document.getElementById('portfolio-chart')?.getContext('2d');
const ctxComponents = document.getElementById('components-chart')?.getContext('2d');

export function createPortfolioChart(labels, datasets, scale) {
    if (!labels.length || !datasets.length) {
        setWarning('No hay suficientes datos históricos para mostrar todas las líneas en el gráfico total.');
        return;
    }
    if (!ctxPortfolio) {
        setError('Contexto del canvas (portfolio-chart) no encontrado');
        return;
    }
    try {
        if (portfolioChart) portfolioChart.destroy();

        let yAxisTitle = 'Valor (€)';
        let dataToUse = datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map(value => value !== null ? value : null)
        }));

        if (scale === 'percentage') {
            yAxisTitle = 'Rentabilidad (%)';
            const initialValue = dataToUse[0].data[0];
            dataToUse = dataToUse.map(dataset => ({
                ...dataset,
                data: dataset.data.map(value => value !== null ? ((value - initialValue) / initialValue) * 100 : null)
            }));
        }

        portfolioChart = new Chart(ctxPortfolio, {
            type: 'line',
            data: { labels, datasets: dataToUse },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        title: { display: true, text: 'Fecha' },
                        ticks: { maxTicksLimit: 5, autoSkip: true },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: yAxisTitle },
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            callback: function(value) {
                                if (scale === 'percentage') {
                                    return value.toFixed(2) + '%';
                                }
                                return '€' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: {
                            font: { size: 12 },
                            color: '#ffffff',
                            padding: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1a1a2e',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00ddeb',
                        borderWidth: 1,
                        callbacks: {
                            title: context => {
                                return `Fecha: ${context[0].label}`;
                            },
                            label: context => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    if (scale === 'percentage') {
                                        label += `${context.parsed.y.toFixed(2)}%`;
                                    } else {
                                        label += `€${context.parsed.y.toFixed(2)}`;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
        portfolioChart.update();
    } catch (error) {
        setError('No se pudo renderizar el gráfico total. Por favor, revisa la consola para más detalles.');
    }
}

export function createComponentsChart(labels, datasets, scale) {
    if (!labels.length || !datasets.length) {
        setWarning('No hay suficientes datos para mostrar todas las líneas en el gráfico de componentes.');
        return;
    }
    if (!ctxComponents) {
        setError('Contexto del canvas (components-chart) no encontrado');
        return;
    }
    try {
        if (componentsChart) componentsChart.destroy();

        let yAxisTitle = 'Valor (€)';
        let dataToUse = datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map(value => value !== null ? value : null)
        }));

        if (scale === 'percentage') {
            yAxisTitle = 'Rentabilidad (%)';
            dataToUse = datasets.map(dataset => {
                const initialValue = dataset.data.find(val => val !== null);
                if (!initialValue) return { ...dataset, data: dataset.data.map(() => null) };
                return {
                    ...dataset,
                    data: dataset.data.map(value => value !== null ? ((value - initialValue) / initialValue) * 100 : null)
                };
            });
        }

        componentsChart = new Chart(ctxComponents, {
            type: 'line',
            data: { labels, datasets: dataToUse },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        title: { display: true, text: 'Fecha' },
                        ticks: { maxTicksLimit: 5, autoSkip: true },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: yAxisTitle },
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            callback: function(value) {
                                if (scale === 'percentage') {
                                    return value.toFixed(2) + '%';
                                }
                                return '€' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: {
                            font: { size: 12 },
                            color: '#ffffff',
                            padding: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1a1a2e',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00ddeb',
                        borderWidth: 1,
                        callbacks: {
                            title: context => {
                                return `Fecha: ${context[0].label}`;
                            },
                            label: context => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    if (scale === 'percentage') {
                                        label += `${context.parsed.y.toFixed(2)}%`;
                                    } else {
                                        label += `€${context.parsed.y.toFixed(2)}`;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
        componentsChart.update();
    } catch (error) {
        setError('No se pudo renderizar el gráfico de componentes. Por favor, revisa la consola para más detalles.');
    }
}

export const chartColors = {
    colorPalette,
    performanceColors
};
