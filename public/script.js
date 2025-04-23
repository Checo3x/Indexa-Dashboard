let portfolioChart = null;
let componentsChart = null;
const ctxPortfolio = document.getElementById('portfolio-chart')?.getContext('2d');
const ctxComponents = document.getElementById('components-chart')?.getContext('2d');

let portfolioChartData = null;
let componentsChartData = null;
let compositionTableData = null;
let historyTableData = null;
let currentToken = null;

if (typeof Chart === 'undefined') {
    setError('Error: No se pudo cargar la librería de gráficos. Por favor, revisa tu conexión o la configuración.');
}

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

function formatDateToMonthYear(dateStr) {
    const date = new Date(dateStr.split(' ')[0]);
    return isNaN(date) ? 'Unknown' : date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

function createPortfolioChart(labels, datasets) {
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
        portfolioChart = new Chart(ctxPortfolio, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'category',
                        title: { display: true, text: 'Fecha' },
                        ticks: { maxTicksLimit: 10, autoSkip: true }
                    },
                    y: {
                        title: { display: true, text: 'Valor (€)' },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += `€${context.parsed.y.toFixed(2)}`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
        portfolioChart.update();
    } catch (error) {
        setError('No se pudo renderizar el gráfico total. Por favor, revisa la consola para más detalles.');
    }
}

function createComponentsChart(labels, datasets) {
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
        componentsChart = new Chart(ctxComponents, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'category',
                        title: { display: true, text: 'Fecha' },
                        ticks: { maxTicksLimit: 10, autoSkip: true }
                    },
                    y: {
                        title: { display: true, text: 'Valor (€)' },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += `€${context.parsed.y.toFixed(2)}`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
        componentsChart.update();
    } catch (error) {
        setError('No se pudo renderizar el gráfico de componentes. Por favor, revisa la consola para más detalles.');
    }
}

function setLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    const fetchDataButton = document.getElementById('fetch-data');
    if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !isLoading);
    if (fetchAccountsButton) fetchAccountsButton.disabled = isLoading;
    if (fetchDataButton) fetchDataButton.disabled = isLoading;
}

function setError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        errorDiv.classList.add('block');
        errorDiv.style.display = 'block';
    }
}

function setWarning(message) {
    const warningDiv = document.getElementById('warning-message');
    if (warningDiv) {
        warningDiv.textContent = message;
        warningDiv.classList.remove('hidden');
    }
}

function clearMessages() {
    const errorMessage = document.getElementById('error-message');
    const warningMessage = document.getElementById('warning-message');
    if (errorMessage) errorMessage.classList.add('hidden');
    if (warningMessage) warningMessage.classList.add('hidden');
}

async function fetchAccounts(token) {
    setLoading(true);
    clearMessages();
    try {
        const response = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP: ${response.status} ${errorData.details || response.statusText}`);
        }
        const userData = await response.json();
        const accounts = userData.accounts || [];
        if (!Array.isArray(accounts)) {
            throw new Error('La respuesta no contiene una lista de cuentas válida');
        }
        const select = document.getElementById('account-select');
        if (select) {
            select.innerHTML = '<option value="">Selecciona una cuenta</option>';
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.account_number;
                option.textContent = `Cuenta ${account.account_number} (${account.type || 'Sin tipo'})`;
                select.appendChild(option);
            });
        }
        const accountSelector = document.getElementById('account-selector');
        if (accountSelector) accountSelector.classList.remove('hidden');
    } catch (error) {
        setError(`Error al cargar cuentas: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

async function fetchPortfolioData(token, accountId) {
    setLoading(true);
    clearMessages();
    try {
        const accountInfo = document.getElementById('account-info');
        const selectedAccount = document.getElementById('selected-account');
        if (accountInfo && selectedAccount) {
            selectedAccount.textContent = `Cuenta ${accountId}`;
            accountInfo.classList.remove('hidden');
        }
        const portfolioResponse = await fetch(`/api/accounts/${accountId}/portfolio`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!portfolioResponse.ok) {
            const errorData = await portfolioResponse.json();
            throw new Error(`Error HTTP (portfolio): ${portfolioResponse.status} ${errorData.details || portfolioResponse.statusText}`);
        }
        const portfolioData = await portfolioResponse.json();
        const historyResponse = await fetch(`/api/accounts/${accountId}/performance`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!historyResponse.ok) {
            const errorData = await historyResponse.json();
            throw new Error(`Error HTTP (performance): ${historyResponse.status} ${errorData.details || historyResponse.statusText}`);
        }
        const historyData = await historyResponse.json();
        let components = [];
        if (portfolioData.portfolio?.cash_accounts?.[0]?.instrument_accounts) {
            components = portfolioData.portfolio.cash_accounts[0].instrument_accounts;
        } else if (portfolioData.comparison) {
            components = portfolioData.comparison;
        }
        let totalValue = components.reduce((sum, component) => sum + (component.amount || 0), 0);
        if (totalValue === 0 && portfolioData.portfolio?.total_amount) {
            totalValue = portfolioData.portfolio.total_amount;
        }
        const additionalCashNeeded = portfolioData.extra?.additional_cash_needed_to_trade ?? 0;
        const annualReturn = (historyData.return?.time_return_annual || historyData.plan_expected_return || 0) * 100;
        const volatility = (historyData.volatility || 0) * 100;
        let labels = [];
        let realValues = [];
        let expectedValues = [];
        let bestValues = [];
        let worstValues = [];
        const currentDate = new Date();
        const earliestDataDate = new Date('2025-03-01');
        const minDate = earliestDataDate;
        const maxDate = new Date(currentDate);
        maxDate.setMonth(maxDate.getMonth() + 5);
        maxDate.setDate(0);
        if (historyData.performance && historyData.performance.period) {
            const periods = historyData.performance.period;
            let realData = historyData.performance.real || [];
            const expectedData = historyData.performance.expected || [];
            const bestData = historyData.performance.best || [];
            const worstData = historyData.performance.worst || [];
            if (!Array.isArray(realData)) {
                if (typeof realData === 'number') {
                    realData = [[0, realData]];
                } else {
                    realData = [];
                }
            } else {
                const isPairFormat = realData.length > 0 && Array.isArray(realData[0]) && realData[0].length === 2;
                if (!isPairFormat) {
                    realData = realData.map((value, index) => [index, value]);
                }
            }
            const initialValue = realData.length > 0 && Array.isArray(realData[0]) && realData[0].length === 2 ? realData[0][1] : 100;
            const filteredPeriods = [];
            const periodIndices = [];
            const isPeriodPairFormat = periods.length > 0 && Array.isArray(periods[0]);
            if (isPeriodPairFormat) {
                periods.forEach((periodEntry, idx) => {
                    if (!Array.isArray(periodEntry) || periodEntry.length < 2 || typeof periodEntry[1] !== 'string') return;
                    const dateStr = periodEntry[1].split(' ')[0];
                    const date = new Date(dateStr);
                    if (isNaN(date)) return;
                    if (date >= minDate && date <= maxDate) {
                        filteredPeriods.push(periodEntry);
                        periodIndices.push(periodEntry[0]);
                    }
                });
            } else {
                periods.forEach((dateStr, idx) => {
                    const date = new Date(dateStr.split(' ')[0]);
                    if (isNaN(date)) return;
                    if (date >= minDate && date <= maxDate) {
                        filteredPeriods.push([idx, dateStr]);
                        periodIndices.push(idx);
                    }
                });
            }
            labels = filteredPeriods.map(periodEntry =>
                Array.isArray(periodEntry) && periodEntry.length >= 2 && typeof periodEntry[1] === 'string'
                    ? formatDateToMonthYear(periodEntry[1])
                    : 'Unknown'
            );
            realValues = new Array(filteredPeriods.length).fill(null);
            realData.forEach(entry => {
                if (!Array.isArray(entry) || entry.length !== 2) return;
                const [index, value] = entry;
                const idx = parseInt(index, 10);
                const filteredIdx = periodIndices.indexOf(idx);
                if (filteredIdx === -1) return;
                const numericValue = Number(value);
                if (isNaN(numericValue)) return;
                realValues[filteredIdx] = numericValue;
            });
            const validIndices = realValues.map((val, idx) => (val !== null ? idx : -1)).filter(idx => idx !== -1);
            if (validIndices.length === 0) {
                labels = [new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })];
                realValues = [totalValue || 0];
                expectedValues = [totalValue || 0];
                bestValues = [totalValue || 0];
                worstValues = [totalValue || 0];
            } else {
                const filteredRealValues = new Array(filteredPeriods.length).fill(null);
                validIndices.forEach(idx => {
                    filteredRealValues[idx] = realValues[idx];
                });
                realValues = filteredRealValues;

                const lastRealIndex = validIndices[validIndices.length - 1];
                const lastRealValue = realValues[lastRealIndex];
                const lastRealPeriodIndex = periodIndices[lastRealIndex];

                totalValue = lastRealValue * (totalValue / initialValue);
                const scalingFactor = totalValue / lastRealValue;

                realValues = realValues.map(value => value !== null ? value * scalingFactor : null);

                const initialFactor = realData[lastRealPeriodIndex][1];
                expectedValues = new Array(labels.length).fill(null);
                bestValues = new Array(labels.length).fill(null);
                worstValues = new Array(labels.length).fill(null);

                for (let i = 0; i <= lastRealIndex; i++) {
                    expectedValues[i] = realValues[i];
                    bestValues[i] = realValues[i];
                    worstValues[i] = realValues[i];
                }

                for (let i = lastRealIndex + 1; i < labels.length; i++) {
                    const index = periodIndices[i];
                    const entryExpected = expectedData[index];
                    if (entryExpected !== undefined) {
                        const factor = entryExpected / initialFactor;
                        const value = lastRealValue * factor * scalingFactor;
                        expectedValues[i] = value;
                    } else {
                        expectedValues[i] = lastRealValue * scalingFactor;
                    }

                    const entryBest = bestData[index];
                    if (entryBest !== undefined) {
                        const factor = entryBest / initialFactor;
                        const value = lastRealValue * factor * scalingFactor;
                        bestValues[i] = value;
                    } else {
                        bestValues[i] = lastRealValue * scalingFactor;
                    }

                    const entryWorst = worstData[index];
                    if (entryWorst !== undefined) {
                        const factor = entryWorst / initialFactor;
                        const value = lastRealValue * factor * scalingFactor;
                        worstValues[i] = value;
                    } else {
                        worstValues[i] = lastRealValue * scalingFactor;
                    }
                }
            }
        } else {
            const portfolioHistory = historyData.portfolios || [];
            let historicalData = portfolioHistory.map(item => ({
                date: item.date || 'N/A',
                value: Number(item.total_amount || 0)
            }));
            if (historicalData.length > 0) {
                historicalData = historicalData.filter(item => {
                    if (item.value <= 0 || item.date === 'N/A') return false;
                    const date = new Date(item.date);
                    return date >= minDate && date <= maxDate;
                });
                historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
            }
            labels = historicalData.map(item => formatuse `formatDateToMonthYear(item.date));
            realValues = historicalData.map(item => item.value);
            if (realValues.length === 0) {
                labels = [new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })];
                realValues = [totalValue || 0];
            }
        }
        const totalValueElement = document.getElementById('total-value');
        if (totalValueElement) totalValueElement.textContent = `€${totalValue.toFixed(2)}`;
        const annualReturnElement = document.getElementById('annual-return');
        if (annualReturnElement) {
            annualReturnElement.textContent = `${annualReturn.toFixed(2)}%`;
            annualReturnElement.classList.remove('bg-red-200');
            if (annualReturn < 0) {
                annualReturnElement.classList.add('bg-red-200');
            }
        }
        const volatilityElement = document.getElementById('volatility');
        if (volatilityElement) {
            volatilityElement.textContent = `${volatility.toFixed(2)}%`;
            volatilityElement.classList.remove('bg-red-200');
            if (volatility < 0) {
                volatilityElement.classList.add('bg-red-200');
            }
        }
        const additionalCashElement = document.getElementById('additional-cash-needed');
        if (additionalCashElement) additionalCashElement.textContent = `€${additionalCashNeeded.toFixed(2)}`;
        const datasets = [];
        if (realValues.length > 0) {
            datasets.push({
                label: 'Real (€)',
                data: realValues,
                borderColor: performanceColors.real,
                tension: 0.1,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        }
        if (expectedValues.length > 0) {
            datasets.push({
                label: 'Esperado (€)',
                data: expectedValues,
                borderColor: performanceColors.expected,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        }
        if (bestValues.length > 0) {
            datasets.push({
                label: 'Mejor Escenario (€)',
                data: bestValues,
                borderColor: performanceColors.best,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        }
        if (worstValues.length > 0) {
            datasets.push({
                label: 'Peor Escenario (€)',
                data: worstValues,
                borderColor: performanceColors.worst,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        }
        portfolioChartData = { labels, datasets };
        const weights = components.map((component, index) => {
            const weight = component.weight_real || (totalValue > 0 ? (component.amount || 0) / totalValue : 0);
            const name = component.instrument?.name || component.instrument?.identifier_name || component.instrument?.description || `Fondo ${index + 1}`;
            const color = colorPalette[index % colorPalette.length];
            return { name, amount: component.amount || 0, weight, color };
        });
        compositionTableData = weights;
        const componentDatasets = [];
        if (realValues.length > 0) {
            componentDatasets.push({
                label: 'Total Cartera (€)',
                data: realValues,
                borderColor: performanceColors.real,
                tension: 0.1,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        }
        weights.forEach(fund => {
            const weight = fund.weight || 0;
            const name = fund.name;
            const color = fund.color;
            const componentValues = realValues.map(value => value !== null ? value * weight : null);
            componentDatasets.push({
                label: `${name} (€)`,
                data: componentValues,
                borderColor: color,
                tension: 0.1,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7
            });
        });
        componentsChartData = { labels, datasets: componentDatasets };
        const tableData = realValues.map((value, index) => {
            let returnPercentage = 0;
            if (index > 0 && value !== null && realValues[index - 1] !== null) {
                const previousValue = realValues[index - 1];
                returnPercentage = ((value - previousValue) / previousValue) * 100;
            }
            return { date: labels[index] || 'N/A', value, return: returnPercentage };
        });
        historyTableData = tableData;

        const portfolioSection = document.getElementById('portfolio-chart-section');
        const componentsSection = document.getElementById('components-chart-section');
        const compositionSection = document.getElementById('composition-section');
        const historySection = document.getElementById('history-section');

        if (portfolioSection && !portfolioSection.classList.contains('hidden')) {
            renderPortfolioChart();
        }
        if (componentsSection && !componentsSection.classList.contains('hidden')) {
            renderComponentsChart();
        }
        if (compositionSection && !compositionSection.classList.contains('hidden')) {
            renderCompositionTable();
        }
        if (historySection && !historySection.classList.contains('hidden')) {
            renderHistoryTable();
        }
    } catch (error) {
        setError(`Error al obtener datos: ${error.message}`);
    } finally {
        setLoading(false);
        const fetchDataButton = document.getElementById('fetch-data');
        if (fetchDataButton) {
            fetchDataButton.classList.add('hidden');
        }
    }
}

function renderPortfolioChart() {
    if (portfolioChartData) {
        createPortfolioChart(portfolioChartData.labels, portfolioChartData.datasets);
    } else {
        setWarning('No hay datos disponibles para el gráfico total.');
    }
}

function renderComponentsChart() {
    if (componentsChartData) {
        createComponentsChart(componentsChartData.labels, componentsChartData.datasets);
    } else {
        setWarning('No hay datos disponibles para el gráfico de componentes.');
    }
}

function renderCompositionTable() {
    const compositionTable = document.getElementById('composition-table');
    if (compositionTable && compositionTableData) {
        compositionTable.innerHTML = '';
        if (compositionTableData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" class="p-2 text-center">No hay datos de composición disponibles</td>`;
            compositionTable.appendChild(row);
        } else {
            compositionTableData.forEach(fund => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2"><div class="w-6 h-6 rounded-full" style="background-color: ${fund.color};"></div></td>
                    <td class="p-2">${fund.name}</td>
                    <td class="p-2">€${fund.amount.toFixed(2)}</td>
                    <td class="p-2">${(fund.weight * 100).toFixed(2)}%</td>
                `;
                compositionTable.appendChild(row);
            });
        }
    }
}

function renderHistoryTable() {
    const tableBody = document.getElementById('history-table');
    if (tableBody && historyTableData) {
        tableBody.innerHTML = '';
        if (historyTableData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="3" class="p-2 text-center">No hay datos históricos disponibles</td>`;
            tableBody.appendChild(row);
        } else {
            const recentData = historyTableData.slice(-10);
            recentData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2">${item.date}</td>
                    <td class="p-2">${item.value !== null ? `€${item.value.toFixed(2)}` : '-'}</td>
                    <td class="p-2">${item.value !== null && item.return !== 0 ? `${item.return.toFixed(2)}%` : '-'}</td>
                `;
                tableBody.appendChild(row);
            });
            if (historyTableData.length > 10) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="3" class="p-2 text-center text-gray-500">Mostrando las últimas 10 entradas de ${historyTableData.length} disponibles</td>`;
                tableBody.appendChild(row);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    if (fetchAccountsButton) {
        fetchAccountsButton.addEventListener('click', () => {
            const tokenInput = document.getElementById('api-token');
            const token = tokenInput.value.trim();
            if (!token) {
                setError('Por favor, introduce un token de API válido.');
                return;
            }
            currentToken = token;
            fetchAccounts(token);
        });
    }

    const fetchDataButton = document.getElementById('fetch-data');
    if (fetchDataButton) {
        fetchDataButton.addEventListener('click', () => {
            const tokenInput = document.getElementById('api-token');
            let token = tokenInput.value.trim();
            
            if (!token && currentToken) {
                token = currentToken;
            }
            
            if (!token) {
                setError('Por favor, introduce un token de API válido.');
                return;
            }
            
            currentToken = token;
            const accountId = document.getElementById('account-select').value;
            if (!accountId) {
                setError('Por favor, selecciona una cuenta.');
                return;
            }
            
            fetchPortfolioData(token, accountId);
        });
    }

    const accountSelect = document.getElementById('account-select');
    if (accountSelect) {
        accountSelect.addEventListener('change', () => {
            clearMessages();
            const accountId = accountSelect.value;
            if (accountId && currentToken) {
                fetchPortfolioData(currentToken, accountId);
            }
        });
    }

    const toggleChartsButton = document.getElementById('toggle-charts');
    if (toggleChartsButton) {
        toggleChartsButton.addEventListener('click', () => {
            const portfolioSection = document.getElementById('portfolio-chart-section');
            const componentsSection = document.getElementById('components-chart-section');
            if (portfolioSection && componentsSection) {
                const isHidden = portfolioSection.classList.contains('hidden');
                portfolioSection.classList.toggle('hidden', !isHidden);
                componentsSection.classList.toggle('hidden', !isHidden);
                toggleChartsButton.textContent = isHidden ? 'Ocultar Gráficos' : 'Mostrar Gráficos';
                if (isHidden) {
                    renderPortfolioChart();
                    renderComponentsChart();
                }
            }
        });
    }

    const toggleCompositionButton = document.getElementById('toggle-composition');
    if (toggleCompositionButton) {
        toggleCompositionButton.addEventListener('click', () => {
            const compositionSection = document.getElementById('composition-section');
            if (compositionSection) {
                const isHidden = compositionSection.classList.contains('hidden');
                compositionSection.classList.toggle('hidden', !isHidden);
                toggleCompositionButton.textContent = isHidden ? 'Ocultar Composición' : 'Mostrar Composición';
                if (isHidden) renderCompositionTable();
            }
        });
    }

    const toggleHistoryButton = document.getElementById('toggle-history');
    if (toggleHistoryButton) {
        toggleHistoryButton.addEventListener('click', () => {
            const historySection = document.getElementById('history-section');
            if (historySection) {
                const isHidden = historySection.classList.contains('hidden');
                historySection.classList.toggle('hidden', !isHidden);
                toggleHistoryButton.textContent = isHidden ? 'Ocultar Histórico' : 'Mostrar Histórico';
                if (isHidden) renderHistoryTable();
            }
        });
    }
});
