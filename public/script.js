let portfolioChart = null;
let componentsChart = null;
const ctxPortfolio = document.getElementById('portfolio-chart')?.getContext('2d');
const ctxComponents = document.getElementById('components-chart')?.getContext('2d');

let portfolioChartData = null;
let componentsChartData = null;
let compositionTableData = null;
let historyTableData = null;
let currentToken = null;

let portfolioScale = 'euros';
let componentsScale = 'euros';

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

function formatDateToDayMonthYear(dateStr) {
    const date = new Date(dateStr.split(' ')[0]);
    return isNaN(date) ? 'Unknown' : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateToMonthYear(dateStr) {
    const date = new Date(dateStr.split(' ')[0]);
    return isNaN(date) ? 'Unknown' : date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

function createPortfolioChart(labels, datasets, scale) {
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
                            color: '#1a1a2e',
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

function createComponentsChart(labels, datasets, scale) {
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
                            color: '#1a1a2e',
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

function setLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    if (loadingIndicator) {
        loadingIndicator.classList.toggle('fade-hidden', !isLoading);
        loadingIndicator.classList.toggle('fade-visible', isLoading);
    }
    if (fetchAccountsButton) fetchAccountsButton.disabled = isLoading;
}

function setError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('fade-hidden');
        errorDiv.classList.add('fade-visible');
    }
}

function setWarning(message) {
    const warningDiv = document.getElementById('warning-message');
    if (warningDiv) {
        warningDiv.textContent = message;
        warningDiv.classList.remove('fade-hidden');
        warningDiv.classList.add('fade-visible');
    }
}

function clearMessages() {
    const errorMessage = document.getElementById('error-message');
    const warningMessage = document.getElementById('warning-message');
    if (errorMessage) {
        errorMessage.classList.remove('fade-visible');
        errorMessage.classList.add('fade-hidden');
    }
    if (warningMessage) {
        warningMessage.classList.remove('fade-visible');
        warningMessage.classList.add('fade-hidden');
    }
}

async function fetchAccounts(token) {
    const tokenInput = document.getElementById('api-token');
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
            select.innerHTML = '<option value="">Selecciona una cuenta para cargar los datos</option>';
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.account_number;
                option.textContent = `Cuenta ${account.account_number} (${account.type || 'Sin tipo'})`;
                select.appendChild(option);
            });
        }
        const accountSelector = document.getElementById('account-selector');
        if (accountSelector) {
            accountSelector.classList.remove('fade-hidden');
            accountSelector.classList.add('fade-visible');
        }
        if (tokenInput) {
            tokenInput.classList.remove('invalid');
            tokenInput.classList.add('valid');
        }

        let totalValue = 0;
        let totalReturn = 0;
        let totalContributions = 0;
        const accountPromises = accounts.map(async account => {
            const portfolioResponse = await fetch(`/api/accounts/${account.account_number}/portfolio`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const portfolioData = await portfolioResponse.json();
            const historyResponse = await fetch(`/api/accounts/${account.account_number}/performance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const historyData = await historyResponse.json();
            const accountValue = portfolioData.portfolio?.total_amount || 0;
            const accountReturn = (historyData.return?.time_return_annual || 0) * 100;
            const accountContributions = portfolioData.extra?.amount_to_trade || 0;
            totalValue += accountValue;
            totalReturn += accountReturn;
            totalContributions += accountContributions;
        });
        await Promise.all(accountPromises);
        totalReturn = accounts.length > 0 ? totalReturn / accounts.length : 0;

        const overviewSection = document.getElementById('overview-section');
        const overviewTotalValue = document.getElementById('overview-total-value');
        const overviewReturn = document.getElementById('overview-return');
        const overviewContributions = document.getElementById('overview-contributions');
        if (overviewSection && overviewTotalValue && overviewReturn && overviewContributions) {
            overviewTotalValue.textContent = `€${totalValue.toFixed(2)}`;
            overviewReturn.textContent = `${totalReturn.toFixed(2)}%`;
            overviewReturn.classList.remove('negative-value', 'positive-value');
            if (totalReturn < 0) overviewReturn.classList.add('negative-value');
            else if (totalReturn > 0) overviewReturn.classList.add('positive-value');
            overviewContributions.textContent = `€${totalContributions.toFixed(2)}`;
            overviewSection.classList.remove('fade-hidden');
            overviewSection.classList.add('fade-visible');
        }
    } catch (error) {
        setError(`Error al cargar cuentas: ${error.message}`);
        if (tokenInput) {
            tokenInput.classList.remove('valid');
            tokenInput.classList.add('invalid');
        }
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
            accountInfo.classList.remove('fade-hidden');
            accountInfo.classList.add('fade-visible');
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
        let cashAmount = 0;
        if (portfolioData.portfolio?.cash_accounts?.[0]?.instrument_accounts) {
            components = portfolioData.portfolio.cash_accounts[0].instrument_accounts;
        } else if (portfolioData.comparison) {
            components = portfolioData.comparison;
        }
        if (portfolioData.portfolio?.cash_amount) {
            cashAmount = portfolioData.portfolio.cash_amount;
        }
        let totalValue = components.reduce((sum, component) => sum + (component.amount || 0), 0);
        totalValue += cashAmount;
        if (totalValue === 0 && portfolioData.portfolio?.total_amount) {
            totalValue = portfolioData.portfolio.total_amount;
        }
        const additionalCashNeeded = portfolioData.extra?.additional_cash_needed_to_trade ?? 0;
        console.log("Dinero Adicional Necesario (desde API):", additionalCashNeeded);
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
                    ? formatDateToDayMonthYear(periodEntry[1])
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
                labels = [new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })];
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
            labels = historicalData.map(item => formatDateToDayMonthYear(item.date));
            realValues = historicalData.map(item => item.value);
            if (realValues.length === 0) {
                labels = [new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })];
                realValues = [totalValue || 0];
            }
        }
        const totalValueElement = document.getElementById('total-value');
        if (totalValueElement) totalValueElement.textContent = `€${totalValue.toFixed(2)}`;
        const annualReturnElement = document.getElementById('annual-return');
        if (annualReturnElement) {
            annualReturnElement.textContent = `${annualReturn.toFixed(2)}%`;
            annualReturnElement.classList.remove('negative-value', 'positive-value');
            if (annualReturn < 0) {
                annualReturnElement.classList.add('negative-value');
            } else if (annualReturn > 0) {
                annualReturnElement.classList.add('positive-value');
            }
        }
        const volatilityElement = document.getElementById('volatility');
        if (volatilityElement) {
            volatilityElement.textContent = `${volatility.toFixed(2)}%`;
            volatilityElement.classList.remove('negative-value', 'positive-value');
            if (volatility < 0) {
                volatilityElement.classList.add('negative-value');
            } else if (volatility > 0) {
                volatilityElement.classList.add('positive-value');
            }
        }
        const datasets = [];
        if (realValues.length > 0) {
            datasets.push({
                label: 'Real (€)',
                data: realValues,
                borderColor: performanceColors.real,
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
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
                pointRadius: 4,
                pointHoverRadius: 6
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
                pointRadius: 4,
                pointHoverRadius: 6
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
                pointRadius: 4,
                pointHoverRadius: 6
            });
        }
        portfolioChartData = { labels, datasets };
        console.log("Componentes obtenidos:", components);
        const weights = components.map((component, index) => {
            const weight = component.weight_real || (totalValue > 0 ? (component.amount || 0) / totalValue : 0);
            const name = component.instrument?.name || component.instrument?.description || `Fondo ${index + 1}`;
            const color = colorPalette[index % colorPalette.length];
            const price = component.positions?.[0]?.price || 0;
            const titles = component.positions?.[0]?.titles || 0;
            console.log(`Componente ${index + 1}:`, { name, amount: component.amount, weight, price, titles });
            return { name, amount: component.amount || 0, weight, color, price, titles };
        });
        compositionTableData = weights;
        const componentDatasets = [];
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
                pointRadius: 4,
                pointHoverRadius: 6
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

        const chartsContainer = document.querySelector('.charts-container');
        const compositionSection = document.getElementById('composition-section');
        const historySection = document.getElementById('history-section');

        if (chartsContainer && !chartsContainer.classList.contains('height-hidden')) {
            renderPortfolioChart();
            renderComponentsChart();
        }
        if (compositionSection && !compositionSection.classList.contains('height-hidden')) {
            renderCompositionTable();
        }
        if (historySection && !historySection.classList.contains('height-hidden')) {
            renderHistoryTable();
        }

        const additionalCashElement = document.getElementById('additional-cash-needed');
        if (additionalCashElement) {
            const additionalCashValue = Number(additionalCashNeeded);
            console.log("Asignando Dinero Adicional Necesario al DOM:", additionalCashValue);
            additionalCashElement.textContent = `€${additionalCashValue.toFixed(2)}`;
        } else {
            console.error("Elemento con ID 'additional-cash-needed' no encontrado en el DOM");
        }
    } catch (error) {
        setError(`Error al obtener datos: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

function renderPortfolioChart() {
    if (portfolioChartData) {
        createPortfolioChart(portfolioChartData.labels, portfolioChartData.datasets, portfolioScale);
    } else {
        setWarning('No hay datos disponibles para el gráfico total.');
    }
}

function renderComponentsChart() {
    if (componentsChartData) {
        createComponentsChart(componentsChartData.labels, componentsChartData.datasets, componentsScale);
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
            row.innerHTML = `<td colspan="6" class="p-2 text-center">No hay datos de composición disponibles</td>`;
            compositionTable.appendChild(row);
        } else {
            compositionTableData.forEach(fund => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2"><div class="w-6 h-6 rounded-full" style="background-color: ${fund.color};"></div></td>
                    <td class="p-2">${fund.name}</td>
                    <td class="p-2">€${fund.amount.toFixed(2)}</td>
                    <td class="p-2">
                        <div class="weight-bar">
                            <div class="weight-bar-fill" style="width: ${(fund.weight * 100).toFixed(2)}%;"></div>
                        </div>
                        ${(fund.weight * 100).toFixed(2)}%
                    </td>
                    <td class="p-2">${fund.price > 0 ? `€${fund.price.toFixed(2)}` : '-'}</td>
                    <td class="p-2">${fund.titles > 0 ? fund.titles.toFixed(2) : '-'}</td>
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
                const returnClass = item.return < 0 ? 'negative-value' : item.return > 0 ? 'positive-value' : '';
                row.innerHTML = `
                    <td class="p-2">${item.date}</td>
                    <td class="p-2">${item.value !== null ? `€${item.value.toFixed(2)}` : '-'}</td>
                    <td class="p-2 ${returnClass}">${item.value !== null && item.return !== 0 ? `${item.return.toFixed(2)}%` : '-'}</td>
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
                tokenInput.classList.remove('valid');
                tokenInput.classList.add('invalid');
                return;
            }
            currentToken = token;
            fetchAccounts(token);
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
            const chartsContainer = document.querySelector('.charts-container');
            if (chartsContainer) {
                const isHidden = chartsContainer.classList.contains('height-hidden');
                chartsContainer.classList.toggle('height-hidden', !isHidden);
                chartsContainer.classList.toggle('height-visible', isHidden);
                toggleChartsButton.innerHTML = isHidden ? '<i class="fas fa-chart-line"></i> Ocultar Gráficos' : '<i class="fas fa-chart-line"></i> Mostrar Gráficos';
                toggleChartsButton.classList.toggle('active', isHidden);
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
                const isHidden = compositionSection.classList.contains('height-hidden');
                compositionSection.classList.toggle('height-hidden', !isHidden);
                compositionSection.classList.toggle('height-visible', isHidden);
                toggleCompositionButton.innerHTML = isHidden ? '<i class="fas fa-table"></i> Ocultar Composición' : '<i class="fas fa-table"></i> Mostrar Composición';
                toggleCompositionButton.classList.toggle('active', isHidden);
                if (isHidden) renderCompositionTable();
            }
        });
    }

    const toggleHistoryButton = document.getElementById('toggle-history');
    if (toggleHistoryButton) {
        toggleHistoryButton.addEventListener('click', () => {
            const historySection = document.getElementById('history-section');
            if (historySection) {
                const isHidden = historySection.classList.contains('height-hidden');
                historySection.classList.toggle('height-hidden', !isHidden);
                historySection.classList.toggle('height-visible', isHidden);
                toggleHistoryButton.innerHTML = isHidden ? '<i class="fas fa-history"></i> Ocultar Histórico' : '<i class="fas fa-history"></i> Mostrar Histórico';
                toggleHistoryButton.classList.toggle('active', isHidden);
                if (isHidden) renderHistoryTable();
            }
        });
    }

    const togglePasswordButton = document.getElementById('toggle-password');
    const tokenInput = document.getElementById('api-token');
    if (togglePasswordButton && tokenInput) {
        togglePasswordButton.addEventListener('click', () => {
            const isPassword = tokenInput.type === 'password';
            tokenInput.type = isPassword ? 'text' : 'password';
            togglePasswordButton.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    }

    document.querySelectorAll('.scale-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const chart = button.getAttribute('data-chart');
            const scale = button.getAttribute('data-scale');
            if (chart === 'portfolio') {
                portfolioScale = scale;
                document.getElementById('portfolio-euros').classList.toggle('active', scale === 'euros');
                document.getElementById('portfolio-percentage').classList.toggle('active', scale === 'percentage');
                renderPortfolioChart();
            } else if (chart === 'components') {
                componentsScale = scale;
                document.getElementById('components-euros').classList.toggle('active', scale === 'euros');
                document.getElementById('components-percentage').classList.toggle('active', scale === 'percentage');
                renderComponentsChart();
            }
        });
    });

    const downloadDataButton = document.getElementById('download-data');
    if (downloadDataButton) {
        downloadDataButton.addEventListener('click', () => {
            if (!portfolioChartData) {
                setWarning('No hay datos disponibles para descargar.');
                return;
            }
            const labels = portfolioChartData.labels;
            const datasets = portfolioChartData.datasets;
            let csvContent = "Fecha";
            datasets.forEach(dataset => {
                csvContent += `,${dataset.label}`;
            });
            csvContent += "\n";
            labels.forEach((label, index) => {
                csvContent += label;
                datasets.forEach(dataset => {
                    const value = dataset.data[index];
                    csvContent += `,${value !== null ? value.toFixed(2) : ''}`;
                });
                csvContent += "\n";
            });
            const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "portfolio_data.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
