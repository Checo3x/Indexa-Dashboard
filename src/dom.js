import { formatDateToDayMonthYear, setWarning } from './utils.js';
import { createPortfolioChart, createComponentsChart, chartColors } from './charts.js';

let portfolioChartData = null;
let componentsChartData = null;
let compositionTableData = null;
let historyTableData = null;
let portfolioScale = 'euros';
let componentsScale = 'euros';

export function renderAccounts(accounts, totalValue, totalReturn, totalContributions) {
    const select = document.getElementById('account-select');
    const tokenInput = document.getElementById('api-token');
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
}

export function renderPortfolio(accountId, portfolioData, historyData) {
    const accountInfo = document.getElementById('account-info');
    const selectedAccount = document.getElementById('selected-account');
    if (accountInfo && selectedAccount) {
        selectedAccount.textContent = `Cuenta ${accountId}`;
        accountInfo.classList.remove('fade-hidden');
        accountInfo.classList.add('fade-visible');
    }

    const components = portfolioData.instrument_accounts?.flatMap(account => account.positions || []) || [];
    let totalValue = portfolioData.portfolio?.total_amount || 0;
    const cashAmount = portfolioData.portfolio?.cash_amount || 0;
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
    const cashAmountElement = document.getElementById('cash-amount');
    if (cashAmountElement) {
        cashAmountElement.textContent = `€${cashAmount.toFixed(2)}`;
    }
    const additionalCashElement = document.getElementById('additional-cash-needed');
    if (additionalCashElement) {
        const additionalCashValue = Number(additionalCashNeeded);
        additionalCashElement.textContent = `€${additionalCashValue.toFixed(2)}`;
    }

    const datasets = [];
    if (realValues.length > 0) {
        datasets.push({
            label: 'Real (€)',
            data: realValues,
            borderColor: chartColors.performanceColors.real,
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
            borderColor: chartColors.performanceColors.expected,
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
            borderColor: chartColors.performanceColors.best,
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
            borderColor: chartColors.performanceColors.worst,
            borderDash: [5, 5],
            tension: 0.1,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    }
    portfolioChartData = { labels, datasets };

    const weights = components.map((component, index) => {
        const weight = component.weight_real || (totalValue > 0 ? (component.amount || 0) / totalValue : 0);
        const name = component.instrument?.name || component.instrument?.description || `Fondo ${index + 1}`;
        const color = chartColors.colorPalette[index % chartColors.colorPalette.length];
        const price = component.price || 0;
        const titles = component.titles || 0;
        return { name, amount: component.amount || 0, weight, color, price, titles };
    });
    compositionTableData = weights;

    const componentDatasets = [];
    weights.forEach(fund => {
        const weight = fund.weight || 0;
        const name = fund.name;
        const color = fund.color;
        const componentValues = realValues.map(value => value !== null ? value * weight : null);
        if (componentValues.some(val => val !== null)) {
            componentDatasets.push({
                label: `${name} (€)`,
                data: componentValues,
                borderColor: color,
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
            });
        }
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
}

export function renderPortfolioChart() {
    if (portfolioChartData) {
        createPortfolioChart(portfolioChartData.labels, portfolioChartData.datasets, portfolioScale);
    } else {
        setWarning('No hay datos disponibles para el gráfico total.');
    }
}

export function renderComponentsChart() {
    if (componentsChartData) {
        createComponentsChart(componentsChartData.labels, componentsChartData.datasets, componentsScale);
    } else {
        setWarning('No hay datos disponibles para el gráfico de componentes.');
    }
}

export function renderCompositionTable() {
    const compositionTable = document.getElementById('composition-table');
    if (compositionTable && compositionTableData) {
        compositionTable.innerHTML = '';
        if (compositionTableData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="p-2 text-center">No hay datos de composición disponibles</td>`;
            compositionTable.appendChild(row);
        } else {
            compositionTableData.forEach(fund => {
                const row = document.createElement('tr');
                row.innerHTML = `
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

export function renderHistoryTable() {
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

export function setPortfolioScale(scale) {
    portfolioScale = scale;
}

export function setComponentsScale(scale) {
    componentsScale = scale;
}

export function downloadData() {
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
}
