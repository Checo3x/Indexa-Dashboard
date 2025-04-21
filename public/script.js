// Refactor del archivo script.js del proyecto Indexa-Dashboard

let portfolioChart = null;
let componentsChart = null;

const ctxPortfolio = document.getElementById('portfolio-chart')?.getContext('2d');
const ctxComponents = document.getElementById('components-chart')?.getContext('2d');

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

function formatDateToMonthYear(dateStr) {
    const date = new Date(dateStr.split(' ')[0]);
    return isNaN(date) ? 'Desconocido' : date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

function createLineChart(ctx, labels, datasets, chartInstanceRef) {
    if (!labels.length || !datasets.length || !ctx) return;
    if (chartInstanceRef.value) chartInstanceRef.value.destroy();

    chartInstanceRef.value = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            scales: {
                x: { type: 'category', title: { display: true, text: 'Fecha' }, ticks: { maxTicksLimit: 10, autoSkip: true } },
                y: { title: { display: true, text: 'Valor (€)' }, beginAtZero: false }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label || ''}: €${ctx.parsed.y?.toFixed(2) || 0}`
                    }
                }
            }
        }
    });
}

function setLoading(loading) {
    document.getElementById('loading-indicator')?.classList.toggle('hidden', !loading);
    document.getElementById('fetch-accounts')?.toggleAttribute('disabled', loading);
    document.getElementById('fetch-data')?.toggleAttribute('disabled', loading);
}

function setMessage(id, text, show = true) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        el.classList.toggle('hidden', !show);
        el.style.display = show ? 'block' : 'none';
    }
}

function clearMessages() {
    setMessage('error-message', '', false);
    setMessage('warning-message', '', false);
}

async function fetchAccounts(token) {
    setLoading(true);
    clearMessages();
    try {
        const res = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.details || res.statusText);

        const select = document.getElementById('account-select');
        if (select) {
            select.innerHTML = '';
            data.accounts?.forEach(acc => {
                const option = document.createElement('option');
                option.value = acc.account_number;
                option.textContent = `Cuenta ${acc.account_number} (${acc.type || 'Sin tipo'})`;
                select.appendChild(option);
            });
            document.getElementById('account-selector')?.classList.remove('hidden');
        }
    } catch (e) {
        setMessage('error-message', `Error al cargar cuentas: ${e.message}`);
    } finally {
        setLoading(false);
    }
}

async function fetchPortfolioData(token, accountNumber) {
    setLoading(true);
    clearMessages();
    try {
        const res = await fetch(`/api/portfolio/${accountNumber}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.details || res.statusText);

        const { chart_data, expected_chart_data, best_case_chart_data, worst_case_chart_data, components } = data;

        const labels = chart_data.map(d => formatDateToMonthYear(d.date));

        const datasets = [
            {
                label: 'Valor real',
                data: chart_data.map(d => d.value),
                fill: false,
                borderColor: performanceColors.real,
                tension: 0.1
            },
            {
                label: 'Esperado',
                data: expected_chart_data.map(d => d.value),
                fill: false,
                borderColor: performanceColors.expected,
                borderDash: [5, 5],
                tension: 0.1
            },
            {
                label: 'Mejor caso',
                data: best_case_chart_data.map(d => d.value),
                fill: false,
                borderColor: performanceColors.best,
                borderDash: [5, 5],
                tension: 0.1
            },
            {
                label: 'Peor caso',
                data: worst_case_chart_data.map(d => d.value),
                fill: false,
                borderColor: performanceColors.worst,
                borderDash: [5, 5],
                tension: 0.1
            }
        ];

        createLineChart(ctxPortfolio, labels, datasets, { value: portfolioChart });

        // Gráfico de componentes
        const compLabels = components.map(c => c.name);
        const compData = components.map(c => c.value);

        if (ctxComponents) {
            if (componentsChart) componentsChart.destroy();
            componentsChart = new Chart(ctxComponents, {
                type: 'bar',
                data: {
                    labels: compLabels,
                    datasets: [{
                        label: 'Distribución de activos',
                        data: compData,
                        backgroundColor: colorPalette.slice(0, components.length)
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        renderPerformanceTable(data.metrics);
    } catch (e) {
        setMessage('error-message', `Error al cargar datos del portafolio: ${e.message}`);
    } finally {
        setLoading(false);
    }
}

function renderPerformanceTable(metrics) {
    const tbody = document.getElementById('performance-table-body');
    if (!tbody || !Array.isArray(metrics)) return;
    tbody.innerHTML = '';
    metrics.forEach(metric => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        const tdValue = document.createElement('td');
        tdName.textContent = metric.name;
        tdValue.textContent = metric.value;
        tr.appendChild(tdName);
        tr.appendChild(tdValue);
        tbody.appendChild(tr);
    });
}

// Eventos al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('token-input');

    document.getElementById('fetch-accounts')?.addEventListener('click', () => {
        const token = tokenInput?.value.trim();
        if (!token) return setMessage('error-message', 'Introduce un token de autenticación.');
        fetchAccounts(token);
    });

    document.getElementById('fetch-data')?.addEventListener('click', () => {
        const token = tokenInput?.value.trim();
        const select = document.getElementById('account-select');
        const accountNumber = select?.value;
        if (!token || !accountNumber) return setMessage('error-message', 'Token o cuenta no válidos.');
        fetchPortfolioData(token, accountNumber);
    });
});
