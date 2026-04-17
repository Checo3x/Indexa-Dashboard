(() => {
  'use strict';

  const state = {
    token: '',
    accounts: [],
    portfolioChart: null,
    componentsChart: null,
    portfolioScale: 'euros',
    componentsScale: 'euros',
    portfolioChartData: null,
    componentsChartData: null,
    compositionTableData: [],
    historyTableData: [],
    ctxPortfolio: null,
    ctxComponents: null,
    els: {},
  };

  const colorPalette = ['#0f62fe', '#24a148', '#8d8d8d', '#1192e8', '#f1c21b', '#fa4d56', '#08bdba', '#8a3ffc'];
  const performanceColors = {
    real: '#0f62fe',
    expected: '#8d8d8d',
    best: '#24a148',
    worst: '#fa4d56',
  };

  const fmtCurrency = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  });

  const fmtPercent = new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function el(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    state.els = {
      tokenInput: el('api-token'),
      togglePassword: el('toggle-password'),
      fetchAccountsButton: el('fetch-accounts'),
      loadingIndicator: el('loading-indicator'),
      errorMessage: el('error-message'),
      warningMessage: el('warning-message'),
      accountSelector: el('account-selector'),
      accountSelect: el('account-select'),
      overviewSection: el('overview-section'),
      overviewTotalValue: el('overview-total-value'),
      overviewReturn: el('overview-return'),
      overviewContributions: el('overview-contributions'),
      accountInfo: el('account-info'),
      selectedAccount: el('selected-account'),
      totalValue: el('total-value'),
      annualReturn: el('annual-return'),
      volatility: el('volatility'),
      cashAmount: el('cash-amount'),
      additionalCashNeeded: el('additional-cash-needed'),
      toggleCharts: el('toggle-charts'),
      chartsContainer: document.querySelector('.charts-container'),
      toggleComposition: el('toggle-composition'),
      compositionSection: el('composition-section'),
      toggleHistory: el('toggle-history'),
      historySection: el('history-section'),
      portfolioCanvas: el('portfolio-chart'),
      componentsCanvas: el('components-chart'),
      portfolioEuros: el('portfolio-euros'),
      portfolioPercentage: el('portfolio-percentage'),
      componentsEuros: el('components-euros'),
      componentsPercentage: el('components-percentage'),
      downloadData: el('download-data'),
      compositionTable: el('composition-table'),
      historyTable: el('history-table'),
    };

    if (state.els.portfolioCanvas && typeof state.els.portfolioCanvas.getContext === 'function') {
      state.ctxPortfolio = state.els.portfolioCanvas.getContext('2d');
    }
    if (state.els.componentsCanvas && typeof state.els.componentsCanvas.getContext === 'function') {
      state.ctxComponents = state.els.componentsCanvas.getContext('2d');
    }
  }

  function showSection(section) {
    if (!section) return;
    section.classList.remove('fade-hidden', 'height-hidden');
    section.classList.add('fade-visible', 'height-visible');
  }

  function hideSection(section) {
    if (!section) return;
    section.classList.remove('fade-visible', 'height-visible');
    section.classList.add('fade-hidden', 'height-hidden');
  }

  function setLoading(isLoading) {
    const { loadingIndicator, fetchAccountsButton } = state.els;
    if (loadingIndicator) {
      loadingIndicator.classList.toggle('fade-hidden', !isLoading);
      loadingIndicator.classList.toggle('fade-visible', isLoading);
    }
    if (fetchAccountsButton) fetchAccountsButton.disabled = isLoading;
  }

  function setError(message) {
    const { errorMessage, warningMessage } = state.els;
    if (warningMessage) hideSection(warningMessage);
    if (errorMessage) {
      errorMessage.textContent = message;
      showSection(errorMessage);
    }
  }

  function setWarning(message) {
    const { warningMessage } = state.els;
    if (warningMessage) {
      warningMessage.textContent = message;
      showSection(warningMessage);
    }
  }

  function clearMessages() {
    if (state.els.errorMessage) hideSection(state.els.errorMessage);
    if (state.els.warningMessage) hideSection(state.els.warningMessage);
  }

  function formatCurrency(value) {
    return fmtCurrency.format(Number.isFinite(value) ? value : 0);
  }

  function formatPercentValue(value) {
    return `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
  }

  function parseDateParts(dateStr) {
    if (!dateStr) return null;
    const value = String(dateStr).split(' ')[0].trim();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDateToDayMonthYear(dateStr) {
    const date = parseDateParts(dateStr);
    if (!date) return 'Sin fecha';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function isPairsArray(arr) {
    return Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0]) && arr[0].length >= 2;
  }

  function normalizeIndexValuePairs(input) {
    if (!Array.isArray(input)) return [];

    return input
      .map((item, index) => {
        if (Array.isArray(item) && item.length >= 2) {
          return [normalizeNumber(item[0], index), normalizeNumber(item[1], null)];
        }
        if (item && typeof item === 'object') {
          const idx = item.index ?? item.period ?? item.x ?? index;
          const value = item.value ?? item.amount ?? item.factor ?? item.y ?? item.total_amount;
          return [normalizeNumber(idx, index), normalizeNumber(value, null)];
        }
        if (typeof item === 'number') {
          return [index, item];
        }
        return [index, null];
      })
      .filter(([, value]) => value !== null && Number.isFinite(value));
  }

  function normalizePeriodEntries(periods) {
    if (!Array.isArray(periods)) return [];

    return periods
      .map((item, index) => {
        if (Array.isArray(item) && item.length >= 2) {
          return {
            index: normalizeNumber(item[0], index),
            date: item[1],
          };
        }
        if (item && typeof item === 'object') {
          return {
            index: normalizeNumber(item.index ?? item.period ?? index, index),
            date: item.date ?? item.label ?? item.x,
          };
        }
        return {
          index,
          date: item,
        };
      })
      .filter(item => item.date !== undefined && item.date !== null);
  }

  function pickValue(object, paths, fallback = 0) {
    for (const path of paths) {
      let current = object;
      let found = true;
      for (const key of path) {
        if (current && Object.prototype.hasOwnProperty.call(current, key)) {
          current = current[key];
        } else {
          found = false;
          break;
        }
      }
      if (found) return normalizeNumber(current, fallback);
    }
    return fallback;
  }

  async function apiFetch(path, token, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const detail = payload && typeof payload === 'object'
        ? payload.details || payload.error || response.statusText
        : payload || response.statusText;
      throw new Error(`${response.status} ${detail}`);
    }

    return payload;
  }

  async function fetchAccounts(token) {
    return apiFetch('/api/users/me', token);
  }

  async function fetchPortfolio(accountId, token) {
    return apiFetch(`/api/accounts/${accountId}/portfolio`, token);
  }

  async function fetchPerformance(accountId, token) {
    return apiFetch(`/api/accounts/${accountId}/performance`, token);
  }

  function buildOverviewMetrics(accountSummaries) {
    const summaries = accountSummaries.filter(Boolean);
    const totalValue = summaries.reduce((acc, item) => acc + item.totalValue, 0);
    const totalContributions = summaries.reduce((acc, item) => acc + item.additionalCash, 0);
    const avgAnnualReturn = summaries.length
      ? summaries.reduce((acc, item) => acc + item.annualReturn, 0) / summaries.length
      : 0;

    return {
      totalValue,
      totalContributions,
      avgAnnualReturn,
    };
  }

  function populateAccountSelect(accounts) {
    const { accountSelect, accountSelector } = state.els;
    if (!accountSelect) return;

    accountSelect.innerHTML = '<option value="">Selecciona una cuenta para cargar los datos</option>';

    accounts.forEach(account => {
      const option = document.createElement('option');
      option.value = account.account_number;
      option.textContent = `Cuenta ${account.account_number} (${account.type || 'Sin tipo'})`;
      accountSelect.appendChild(option);
    });

    showSection(accountSelector);
  }

  function updateOverview({ totalValue, totalContributions, avgAnnualReturn }) {
    const { overviewSection, overviewTotalValue, overviewReturn, overviewContributions } = state.els;
    if (overviewTotalValue) overviewTotalValue.textContent = formatCurrency(totalValue);
    if (overviewReturn) {
      overviewReturn.textContent = formatPercentValue(avgAnnualReturn);
      overviewReturn.classList.remove('negative-value', 'positive-value');
      if (avgAnnualReturn < 0) overviewReturn.classList.add('negative-value');
      if (avgAnnualReturn > 0) overviewReturn.classList.add('positive-value');
    }
    if (overviewContributions) overviewContributions.textContent = formatCurrency(totalContributions);
    showSection(overviewSection);
  }

  function updateTokenValidity(isValid) {
    const { tokenInput } = state.els;
    if (!tokenInput) return;
    tokenInput.classList.toggle('valid', isValid);
    tokenInput.classList.toggle('invalid', !isValid);
  }

  function updateAccountDetails({ accountId, totalValue, annualReturn, volatility, cashAmount, additionalCashNeeded }) {
    const {
      accountInfo,
      selectedAccount,
      totalValue: totalValueEl,
      annualReturn: annualReturnEl,
      volatility: volatilityEl,
      cashAmount: cashAmountEl,
      additionalCashNeeded: additionalCashNeededEl,
    } = state.els;

    if (selectedAccount) selectedAccount.textContent = `Cuenta ${accountId}`;
    showSection(accountInfo);

    if (totalValueEl) totalValueEl.textContent = formatCurrency(totalValue);
    if (annualReturnEl) {
      annualReturnEl.textContent = formatPercentValue(annualReturn);
      annualReturnEl.classList.remove('negative-value', 'positive-value');
      if (annualReturn < 0) annualReturnEl.classList.add('negative-value');
      if (annualReturn > 0) annualReturnEl.classList.add('positive-value');
    }
    if (volatilityEl) {
      volatilityEl.textContent = formatPercentValue(volatility);
      volatilityEl.classList.remove('negative-value', 'positive-value');
      if (volatility < 0) volatilityEl.classList.add('negative-value');
      if (volatility > 0) volatilityEl.classList.add('positive-value');
    }
    if (cashAmountEl) cashAmountEl.textContent = formatCurrency(cashAmount);
    if (additionalCashNeededEl) additionalCashNeededEl.textContent = formatCurrency(additionalCashNeeded);
  }

  function buildPortfolioSeries(performanceData, totalValue) {
    const performance = performanceData?.performance;

    if (performance && Array.isArray(performance.period) && performance.period.length > 0) {
      const periodEntries = normalizePeriodEntries(performance.period);
      const realPairs = normalizeIndexValuePairs(performance.real);
      const expectedPairs = normalizeIndexValuePairs(performance.expected);
      const bestPairs = normalizeIndexValuePairs(performance.best);
      const worstPairs = normalizeIndexValuePairs(performance.worst);

      const realMap = new Map(realPairs);
      const expectedMap = new Map(expectedPairs);
      const bestMap = new Map(bestPairs);
      const worstMap = new Map(worstPairs);

      const rawReal = periodEntries.map(entry => {
        const value = realMap.get(entry.index);
        return Number.isFinite(value) ? value : null;
      });

      const lastRealIndex = rawReal.reduce((last, value, index) => (value !== null ? index : last), -1);
      const rawBase = lastRealIndex >= 0 ? rawReal[lastRealIndex] : null;
      const scaleFactor = rawBase && totalValue ? totalValue / rawBase : 1;

      const labels = periodEntries.map(entry => formatDateToDayMonthYear(entry.date));
      const realValues = rawReal.map(value => (value === null ? null : value * scaleFactor));

      const futureFromMap = (map, entryIndex) => {
        const raw = map.get(entryIndex);
        if (!Number.isFinite(raw) || !Number.isFinite(rawBase) || !rawBase) return null;
        return totalValue * (raw / rawBase);
      };

      const expectedValues = periodEntries.map((entry, index) => {
        if (index <= lastRealIndex) return realValues[index];
        const value = futureFromMap(expectedMap, entry.index);
        return value === null ? totalValue : value;
      });

      const bestValues = periodEntries.map((entry, index) => {
        if (index <= lastRealIndex) return realValues[index];
        const value = futureFromMap(bestMap, entry.index);
        return value === null ? totalValue : value;
      });

      const worstValues = periodEntries.map((entry, index) => {
        if (index <= lastRealIndex) return realValues[index];
        const value = futureFromMap(worstMap, entry.index);
        return value === null ? totalValue : value;
      });

      if (realValues.some(value => value !== null)) {
        return {
          labels,
          realValues,
          expectedValues,
          bestValues,
          worstValues,
        };
      }
    }

    const portfolios = Array.isArray(performanceData?.portfolios) ? performanceData.portfolios : [];
    const historicalData = portfolios
      .map(item => ({
        date: item.date || 'N/A',
        value: normalizeNumber(item.total_amount, 0),
      }))
      .filter(item => item.value > 0 && item.date !== 'N/A')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = historicalData.length
      ? historicalData.map(item => formatDateToDayMonthYear(item.date))
      : [new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })];

    const realValues = historicalData.length
      ? historicalData.map(item => item.value)
      : [totalValue || 0];

    return {
      labels,
      realValues,
      expectedValues: [],
      bestValues: [],
      worstValues: [],
    };
  }

  function buildCompositionData(portfolioData, totalValue) {
    const positions = portfolioData?.instrument_accounts?.flatMap(account => account.positions || []) || [];

    return positions.map((component, index) => {
      const amount = normalizeNumber(component.amount, 0);
      const weight = normalizeNumber(component.weight_real, 0) || (totalValue > 0 ? amount / totalValue : 0);
      const name = component.instrument?.name || component.instrument?.description || `Fondo ${index + 1}`;
      return {
        name,
        amount,
        weight,
        color: colorPalette[index % colorPalette.length],
        price: normalizeNumber(component.price, 0),
        titles: normalizeNumber(component.titles, 0),
      };
    });
  }

  function buildComponentsSeries(labels, composition, realValues) {
    return composition.map(component => ({
      label: `${component.name} (€)`,
      data: realValues.map(value => (value === null ? null : value * component.weight)),
      borderColor: component.color,
      tension: 0.1,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    }));
  }

  function buildHistoryTable(labels, realValues) {
    return labels.map((label, index) => {
      const value = realValues[index];
      const previous = index > 0 ? realValues[index - 1] : null;
      const change = value !== null && previous !== null && previous !== 0 ? ((value - previous) / previous) * 100 : 0;
      return {
        date: label,
        value,
        return: change,
      };
    });
  }

  function createLineChart(ctx, labels, datasets, scale, yAxisTitle) {
    if (!ctx) return null;
    if (!labels.length || !datasets.length) {
      setWarning('No hay suficientes datos para mostrar el gráfico.');
      return null;
    }

    const normalizedDatasets = datasets.map(dataset => ({
      ...dataset,
      data: dataset.data.map(value => (value === null ? null : value)),
    }));

    const chartData = scale === 'percentage'
      ? normalizedDatasets.map(dataset => {
          const base = dataset.data.find(value => value !== null && value !== 0);
          if (!base) {
            return { ...dataset, data: dataset.data.map(() => null) };
          }
          return {
            ...dataset,
            data: dataset.data.map(value => {
              if (value === null) return null;
              return ((value - base) / base) * 100;
            }),
          };
        })
      : normalizedDatasets;

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: chartData,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Fecha', color: '#334155' },
            ticks: { maxTicksLimit: 6, autoSkip: true, color: '#475569' },
            grid: { display: false },
          },
          y: {
            title: { display: true, text: yAxisTitle, color: '#334155' },
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: {
              color: '#475569',
              callback(value) {
                if (scale === 'percentage') return `${Number(value).toFixed(2)}%`;
                return `€${Number(value).toFixed(2)}`;
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#334155',
              padding: 12,
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#0f172a',
            bodyColor: '#0f172a',
            borderColor: '#cbd5e1',
            borderWidth: 1,
            callbacks: {
              title(context) {
                return `Fecha: ${context[0].label}`;
              },
              label(context) {
                const label = context.dataset.label ? `${context.dataset.label}: ` : '';
                const value = context.parsed.y;
                if (value === null || value === undefined) return `${label}-`;
                return scale === 'percentage'
                  ? `${label}${Number(value).toFixed(2)}%`
                  : `${label}€${Number(value).toFixed(2)}`;
              },
            },
          },
        },
        elements: {
          line: { borderWidth: 3 },
          point: { radius: 4, hoverRadius: 6 },
        },
      },
    });
  }

  function renderPortfolioChart() {
    if (!state.portfolioChartData) return;
    if (state.portfolioChart) state.portfolioChart.destroy();

    const datasets = [];
    const { labels, realValues, expectedValues, bestValues, worstValues } = state.portfolioChartData;

    if (realValues.length) {
      datasets.push({
        label: 'Real',
        data: realValues,
        borderColor: performanceColors.real,
        tension: 0.1,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }
    if (expectedValues.length) {
      datasets.push({
        label: 'Esperado',
        data: expectedValues,
        borderColor: performanceColors.expected,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }
    if (bestValues.length) {
      datasets.push({
        label: 'Mejor escenario',
        data: bestValues,
        borderColor: performanceColors.best,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }
    if (worstValues.length) {
      datasets.push({
        label: 'Peor escenario',
        data: worstValues,
        borderColor: performanceColors.worst,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    state.portfolioChart = createLineChart(
      state.ctxPortfolio,
      labels,
      datasets,
      state.portfolioScale,
      state.portfolioScale === 'percentage' ? 'Rentabilidad (%)' : 'Valor (€)'
    );
  }

  function renderComponentsChart() {
    if (!state.componentsChartData) return;
    if (state.componentsChart) state.componentsChart.destroy();

    state.componentsChart = createLineChart(
      state.ctxComponents,
      state.componentsChartData.labels,
      state.componentsChartData.datasets,
      state.componentsScale,
      state.componentsScale === 'percentage' ? 'Rentabilidad (%)' : 'Valor (€)'
    );
  }

  function renderCompositionTable() {
    const { compositionTable } = state.els;
    if (!compositionTable) return;

    compositionTable.innerHTML = '';

    if (!state.compositionTableData.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" class="p-2 text-center">No hay datos de composición disponibles</td>';
      compositionTable.appendChild(row);
      return;
    }

    state.compositionTableData.forEach(fund => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="p-2">${fund.name}</td>
        <td class="p-2">${formatCurrency(fund.amount)}</td>
        <td class="p-2">
          <div class="weight-bar">
            <div class="weight-bar-fill" style="width: ${(fund.weight * 100).toFixed(2)}%;"></div>
          </div>
          ${(fund.weight * 100).toFixed(2)}%
        </td>
        <td class="p-2">${fund.price > 0 ? formatCurrency(fund.price) : '-'}</td>
        <td class="p-2">${fund.titles > 0 ? fund.titles.toFixed(2) : '-'}</td>
      `;
      compositionTable.appendChild(row);
    });
  }

  function renderHistoryTable() {
    const { historyTable } = state.els;
    if (!historyTable) return;

    historyTable.innerHTML = '';

    if (!state.historyTableData.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" class="p-2 text-center">No hay datos históricos disponibles</td>';
      historyTable.appendChild(row);
      return;
    }

    function sortByDateAsc(data) {
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
}

    sortByDateAsc(state.historyTableData).slice(-10).forEach(item => {
      const row = document.createElement('tr');
      const returnClass = item.return < 0 ? 'negative-value' : item.return > 0 ? 'positive-value' : '';
      row.innerHTML = `
        <td class="p-2">${item.date}</td>
        <td class="p-2">${item.value !== null ? formatCurrency(item.value) : '-'}</td>
        <td class="p-2 ${returnClass}">${item.value !== null && item.return !== 0 ? `${item.return.toFixed(2)}%` : '-'}</td>
      `;
      historyTable.appendChild(row);
    });

    if (state.historyTableData.length > 10) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="3" class="p-2 text-center text-slate-500">Mostrando las últimas 10 entradas de ${state.historyTableData.length}</td>`;
      historyTable.appendChild(row);
    }
  }

  function refreshVisibleSections() {
    if (state.els.chartsContainer && !state.els.chartsContainer.classList.contains('height-hidden')) {
      renderPortfolioChart();
      renderComponentsChart();
    }
    if (state.els.compositionSection && !state.els.compositionSection.classList.contains('height-hidden')) {
      renderCompositionTable();
    }
    if (state.els.historySection && !state.els.historySection.classList.contains('height-hidden')) {
      renderHistoryTable();
    }
  }

  async function loadAccounts() {
    const token = state.els.tokenInput?.value.trim();
    if (!token) {
      setError('Por favor, introduce un token de API válido.');
      updateTokenValidity(false);
      return;
    }

    state.token = token;
    clearMessages();
    setLoading(true);

    try {
      const userData = await fetchAccounts(token);
      const accounts = Array.isArray(userData?.accounts) ? userData.accounts : [];
      if (!accounts.length) {
        throw new Error('La respuesta no contiene cuentas válidas.');
      }

      state.accounts = accounts;
      populateAccountSelect(accounts);
      updateTokenValidity(true);

      const summaries = await Promise.all(accounts.map(async account => {
        try {
          const [portfolioData, performanceData] = await Promise.all([
            fetchPortfolio(account.account_number, token),
            fetchPerformance(account.account_number, token),
          ]);

          return {
            totalValue: normalizeNumber(portfolioData?.portfolio?.total_amount, 0),
            annualReturn: normalizeNumber(performanceData?.return?.time_return_annual, 0) * 100,
            additionalCash: pickValue(portfolioData || {}, [
              ['extra', 'amount_to_trade'],
              ['extra', 'additional_cash_needed_to_trade'],
            ], 0),
          };
        } catch (error) {
          return null;
        }
      }));

      updateOverview(buildOverviewMetrics(summaries));
    } catch (error) {
      setError(`Error al cargar cuentas: ${error.message}`);
      updateTokenValidity(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadPortfolioData(accountId) {
    if (!state.token) {
      setError('Primero carga un token válido.');
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      const [portfolioData, performanceData] = await Promise.all([
        fetchPortfolio(accountId, state.token),
        fetchPerformance(accountId, state.token),
      ]);

      const totalValue = normalizeNumber(portfolioData?.portfolio?.total_amount, 0);
      const cashAmount = normalizeNumber(portfolioData?.portfolio?.cash_amount, 0);
      const additionalCashNeeded = pickValue(portfolioData || {}, [
        ['extra', 'additional_cash_needed_to_trade'],
        ['extra', 'amount_to_trade'],
      ], 0);
      const annualReturn = normalizeNumber(performanceData?.return?.time_return_annual ?? performanceData?.plan_expected_return, 0) * 100;
      const volatility = normalizeNumber(performanceData?.volatility, 0) * 100;

      updateAccountDetails({
        accountId,
        totalValue,
        annualReturn,
        volatility,
        cashAmount,
        additionalCashNeeded,
      });

      const series = buildPortfolioSeries(performanceData, totalValue);
      state.portfolioChartData = series;

      state.compositionTableData = buildCompositionData(portfolioData, totalValue);
      state.componentsChartData = {
        labels: series.labels,
        datasets: buildComponentsSeries(series.labels, state.compositionTableData, series.realValues),
      };

      state.historyTableData = buildHistoryTable(series.labels, series.realValues);

      refreshVisibleSections();
    } catch (error) {
      setError(`Error al obtener datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function downloadPortfolioCsv() {
    if (!state.portfolioChartData) {
      setWarning('No hay datos disponibles para descargar.');
      return;
    }

    const { labels } = state.portfolioChartData;
    const datasets = state.portfolioChartData.datasets || [];
    let csv = 'Fecha,' + datasets.map(dataset => dataset.label).join(',') + '\n';

    labels.forEach((label, index) => {
      const row = [label];
      datasets.forEach(dataset => {
        const value = dataset.data[index];
        row.push(value === null || value === undefined ? '' : Number(value).toFixed(2));
      });
      csv += `${row.join(',')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'portfolio_data.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function setScale(chartName, scale) {
    if (chartName === 'portfolio') {
      state.portfolioScale = scale;
      state.els.portfolioEuros?.classList.toggle('active', scale === 'euros');
      state.els.portfolioPercentage?.classList.toggle('active', scale === 'percentage');
      renderPortfolioChart();
      return;
    }

    if (chartName === 'components') {
      state.componentsScale = scale;
      state.els.componentsEuros?.classList.toggle('active', scale === 'euros');
      state.els.componentsPercentage?.classList.toggle('active', scale === 'percentage');
      renderComponentsChart();
    }
  }

  function toggleVisibility(button, section, labelVisible, labelHidden, iconClass) {
    if (!button || !section) return;

    const isHidden = section.classList.contains('height-hidden');
    if (isHidden) {
      section.classList.remove('height-hidden');
      section.classList.add('height-visible');
      button.classList.add('active');
      button.innerHTML = `<i class="${iconClass}"></i> ${labelHidden}`;
      refreshVisibleSections();
    } else {
      section.classList.remove('height-visible');
      section.classList.add('height-hidden');
      button.classList.remove('active');
      button.innerHTML = `<i class="${iconClass}"></i> ${labelVisible}`;
    }
  }

  function bindEvents() {
    const {
      fetchAccountsButton,
      accountSelect,
      toggleCharts,
      toggleComposition,
      toggleHistory,
      togglePassword,
      portfolioEuros,
      portfolioPercentage,
      componentsEuros,
      componentsPercentage,
      downloadData,
      tokenInput,
    } = state.els;

    fetchAccountsButton?.addEventListener('click', loadAccounts);

    accountSelect?.addEventListener('change', () => {
      clearMessages();
      const accountId = accountSelect.value;
      if (accountId) loadPortfolioData(accountId);
    });

    toggleCharts?.addEventListener('click', () => {
      toggleVisibility(toggleCharts, state.els.chartsContainer, 'Mostrar Gráficos', 'Ocultar Gráficos', 'fas fa-chart-line');
    });

    toggleComposition?.addEventListener('click', () => {
      toggleVisibility(toggleComposition, state.els.compositionSection, 'Mostrar Composición', 'Ocultar Composición', 'fas fa-table');
    });

    toggleHistory?.addEventListener('click', () => {
      toggleVisibility(toggleHistory, state.els.historySection, 'Mostrar Histórico', 'Ocultar Histórico', 'fas fa-history');
    });

    togglePassword?.addEventListener('click', () => {
      if (!tokenInput) return;
      const isPassword = tokenInput.type === 'password';
      tokenInput.type = isPassword ? 'text' : 'password';
      togglePassword.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });

    [portfolioEuros, portfolioPercentage, componentsEuros, componentsPercentage]
      .filter(Boolean)
      .forEach(button => {
        button.addEventListener('click', () => {
          const chart = button.getAttribute('data-chart');
          const scale = button.getAttribute('data-scale');
          if (chart && scale) setScale(chart, scale);
        });
      });

    downloadData?.addEventListener('click', downloadPortfolioCsv);
  }

  function init() {
    cacheElements();
    bindEvents();
    if (typeof Chart === 'undefined') {
      setError('Error: no se pudo cargar la librería de gráficos.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
