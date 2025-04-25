document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const apiTokenInput = document.getElementById('api-token');
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    const togglePasswordButton = document.getElementById('toggle-password');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const warningMessage = document.getElementById('warning-message');
    const accountSelector = document.getElementById('account-selector');
    const accountSelect = document.getElementById('account-select');
    const overviewSection = document.getElementById('overview-section');
    const overviewTotalValue = document.getElementById('overview-total-value');
    const overviewReturn = document.getElementById('overview-return');
    const overviewContributions = document.getElementById('overview-contributions');
    const accountInfo = document.getElementById('account-info');
    const selectedAccount = document.getElementById('selected-account');
    const totalValue = document.getElementById('total-value');
    const annualReturn = document.getElementById('annual-return');
    const volatility = document.getElementById('volatility');
    const cashAmount = document.getElementById('cash-amount');
    const additionalCashNeeded = document.getElementById('additional-cash-needed');
    const toggleChartsButton = document.getElementById('toggle-charts');
    const toggleCompositionButton = document.getElementById('toggle-composition');
    const toggleHistoryButton = document.getElementById('toggle-history');
    const chartsContainer = document.querySelector('.charts-container');
    const compositionSection = document.getElementById('composition-section');
    const historySection = document.getElementById('history-section');
    const compositionTable = document.getElementById('composition-table');
    const historyTable = document.getElementById('history-table');
    const portfolioChartCanvas = document.getElementById('portfolio-chart');
    const componentsChartCanvas = document.getElementById('components-chart');
    const portfolioEurosButton = document.getElementById('portfolio-euros');
    const portfolioPercentageButton = document.getElementById('portfolio-percentage');
    const componentsEurosButton = document.getElementById('components-euros');
    const componentsPercentageButton = document.getElementById('components-percentage');
    const downloadDataButton = document.getElementById('download-data');

    let portfolioChart, componentsChart;
    let accountsData = [];
    let portfolioData = [];
    let performanceData = [];

    // Mostrar/Ocultar contraseña
    togglePasswordButton.addEventListener('click', () => {
        const type = apiTokenInput.type === 'password' ? 'text' : 'password';
        apiTokenInput.type = type;
    });

    // Función para mostrar mensajes
    const showMessage = (element, message, type) => {
        element.textContent = message;
        element.classList.remove('fade-hidden');
        element.classList.add('fade-visible');
        setTimeout(() => {
            element.classList.remove('fade-visible');
            element.classList.add('fade-hidden');
        }, 5000);
    };

    // Función para formatear valores monetarios
    const formatCurrency = (value) => `€${value.toFixed(2)}`;
    const formatPercentage = (value) => `${value.toFixed(2)}%`;

    // Cargar cuentas
    fetchAccountsButton.addEventListener('click', async () => {
        const token = apiTokenInput.value.trim();
        if (!token) {
            showMessage(errorMessage, 'Por favor, introduce un token de API válido.', 'error');
            return;
        }

        loadingIndicator.classList.remove('fade-hidden');
        loadingIndicator.classList.add('fade-visible');

        try {
            // Simulamos la respuesta de la API (basada en los datos que hemos visto)
            accountsData = [
                { id: 'LDHK6U7Z', name: 'Cuenta LDHK6U7Z (pension)', total_amount: 4127.73 },
                { id: 'AB1B3D1T', name: 'Cuenta AB1B3D1T (mutual)', total_amount: 4127.73 },
                { id: 'LKX459.J7', name: 'Cuenta LKX459.J7 (mutual)', total_amount: 2302.31 }
            ];

            // Actualizar el desplegable
            accountSelect.innerHTML = '<option value="">Selecciona una cuenta para cargar los datos</option>';
            accountsData.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = account.name;
                accountSelect.appendChild(option);
            });

            // Mostrar el selector de cuentas
            accountSelector.classList.remove('fade-hidden');
            accountSelector.classList.add('fade-visible');

            // Calcular y mostrar el resumen
            const totalValueSum = accountsData.reduce((sum, account) => sum + account.total_amount, 0);
            const avgReturn = 0.50; // Valor fijo basado en la captura
            const totalContributions = 0.00; // Valor fijo basado en la captura

            overviewTotalValue.textContent = formatCurrency(totalValueSum);
            overviewReturn.textContent = formatPercentage(avgReturn);
            overviewReturn.className = avgReturn < 0 ? 'negative-value' : 'positive-value';
            overviewContributions.textContent = formatCurrency(totalContributions);

            overviewSection.classList.remove('fade-hidden');
            overviewSection.classList.add('fade-visible');
        } catch (error) {
            showMessage(errorMessage, 'Error al cargar las cuentas. Verifica tu token de API.', 'error');
        } finally {
            loadingIndicator.classList.remove('fade-visible');
            loadingIndicator.classList.add('fade-hidden');
        }
    });

    // Cargar datos de la cuenta seleccionada
    accountSelect.addEventListener('change', async () => {
        const accountId = accountSelect.value;
        if (!accountId) {
            accountInfo.classList.remove('fade-visible');
            accountInfo.classList.add('fade-hidden');
            chartsContainer.classList.remove('height-visible');
            chartsContainer.classList.add('height-hidden');
            compositionSection.classList.remove('height-visible');
            compositionSection.classList.add('height-hidden');
            historySection.classList.remove('height-visible');
            historySection.classList.add('height-hidden');
            return;
        }

        loadingIndicator.classList.remove('fade-hidden');
        loadingIndicator.classList.add('fade-visible');

        try {
            // Simulamos la respuesta de la API para la cuenta seleccionada
            let accountDetails;
            if (accountId === 'LDHK6U7Z') {
                accountDetails = {
                    id: 'LDHK6U7Z',
                    name: 'Cuenta LDHK6U7Z (pension)',
                    total_amount: 4127.73,
                    annual_return: -0.63,
                    volatility: 0.00,
                    cash_amount: 0.00,
                    additional_cash_needed: 20.00
                };
            } else if (accountId === 'AB1B3D1T') {
                accountDetails = {
                    id: 'AB1B3D1T',
                    name: 'Cuenta AB1B3D1T (mutual)',
                    total_amount: 4127.73,
                    annual_return: 0.00,
                    volatility: 0.00,
                    cash_amount: 75.86,
                    additional_cash_needed: 0.00
                };
            } else if (accountId === 'LKX459.J7') {
                accountDetails = {
                    id: 'LKX459.J7',
                    name: 'Cuenta LKX459.J7 (mutual)',
                    total_amount: 2302.31,
                    annual_return: 0.00,
                    volatility: 0.00,
                    cash_amount: 0.00,
                    additional_cash_needed: 0.00
                };
            }

            // Actualizar información de la cuenta
            selectedAccount.textContent = accountDetails.name;
            totalValue.textContent = formatCurrency(accountDetails.total_amount);
            annualReturn.textContent = formatPercentage(accountDetails.annual_return);
            annualReturn.className = accountDetails.annual_return < 0 ? 'negative-value' : 'positive-value';
            volatility.textContent = formatPercentage(accountDetails.volatility);
            cashAmount.textContent = formatCurrency(accountDetails.cash_amount);
            additionalCashNeeded.textContent = formatCurrency(accountDetails.additional_cash_needed);

            accountInfo.classList.remove('fade-hidden');
            accountInfo.classList.add('fade-visible');

            // Simulamos la carga de datos de portfolio y performance
            portfolioData = [
                { date: '2025-04-24', amount: accountDetails.total_amount }
            ];
            performanceData = [
                { date: '2025-04-24', amount: accountDetails.total_amount, return: accountDetails.annual_return }
            ];

            // Actualizar gráficos
            updatePortfolioChart('euros');
            updateComponentsChart('euros');

            // Simulamos datos de composición e histórico
            compositionTable.innerHTML = '<tr><td colspan="6" class="text-center">Datos de ejemplo no disponibles.</td></tr>';
            historyTable.innerHTML = '<tr><td colspan="3" class="text-center">Datos de ejemplo no disponibles.</td></tr>';
        } catch (error) {
            showMessage(errorMessage, 'Error al cargar los datos de la cuenta.', 'error');
        } finally {
            loadingIndicator.classList.remove('fade-visible');
            loadingIndicator.classList.add('fade-hidden');
        }
    });

    // Funciones para gráficos (simplificadas)
    const updatePortfolioChart = (scale) => {
        if (portfolioChart) portfolioChart.destroy();
        portfolioChart = new Chart(portfolioChartCanvas, {
            type: 'line',
            data: {
                labels: portfolioData.map(d => d.date),
                datasets: [{
                    label: `Valor (${scale === 'euros' ? '€' : '%'})`,
                    data: portfolioData.map(d => scale === 'euros' ? d.amount : (d.amount / portfolioData[0].amount - 1) * 100),
                    borderColor: '#00ddeb',
                    backgroundColor: 'rgba(0, 221, 235, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Fecha', color: '#e0e0e0' } },
                    y: { title: { display: true, text: scale === 'euros' ? 'Valor (€)' : 'Rentabilidad (%)', color: '#e0e0e0' } }
                },
                plugins: {
                    legend: { labels: { color: '#e0e0e0' } }
                }
            }
        });
    };

    const updateComponentsChart = (scale) => {
        if (componentsChart) componentsChart.destroy();
        componentsChart = new Chart(componentsChartCanvas, {
            type: 'line',
            data: {
                labels: performanceData.map(d => d.date),
                datasets: [{
                    label: `Componente (${scale === 'euros' ? '€' : '%'})`,
                    data: performanceData.map(d => scale === 'euros' ? d.amount : d.return),
                    borderColor: '#ff00ff',
                    backgroundColor: 'rgba(255, 0, 255, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Fecha', color: '#e0e0e0' } },
                    y: { title: { display: true, text: scale === 'euros' ? 'Valor (€)' : 'Rentabilidad (%)', color: '#e0e0e0' } }
                },
                plugins: {
                    legend: { labels: { color: '#e0e0e0' } }
                }
            }
        });
    };

    // Eventos para botones de escala
    portfolioEurosButton.addEventListener('click', () => {
        portfolioEurosButton.classList.add('active');
        portfolioPercentageButton.classList.remove('active');
        updatePortfolioChart('euros');
    });

    portfolioPercentageButton.addEventListener('click', () => {
        portfolioPercentageButton.classList.add('active');
        portfolioEurosButton.classList.remove('active');
        updatePortfolioChart('percentage');
    });

    componentsEurosButton.addEventListener('click', () => {
        componentsEurosButton.classList.add('active');
        componentsPercentageButton.classList.remove('active');
        updateComponentsChart('euros');
    });

    componentsPercentageButton.addEventListener('click', () => {
        componentsPercentageButton.classList.add('active');
        componentsEurosButton.classList.remove('active');
        updateComponentsChart('percentage');
    });

    // Mostrar/Ocultar secciones
    toggleChartsButton.addEventListener('click', () => {
        const isVisible = chartsContainer.classList.contains('height-visible');
        chartsContainer.classList.toggle('height-visible', !isVisible);
        chartsContainer.classList.toggle('height-hidden', isVisible);
        toggleChartsButton.textContent = isVisible ? 'Mostrar Gráficos' : 'Ocultar Gráficos';
        toggleChartsButton.classList.toggle('active', !isVisible);
    });

    toggleCompositionButton.addEventListener('click', () => {
        const isVisible = compositionSection.classList.contains('height-visible');
        compositionSection.classList.toggle('height-visible', !isVisible);
        compositionSection.classList.toggle('height-hidden', isVisible);
        toggleCompositionButton.textContent = isVisible ? 'Mostrar Composición' : 'Ocultar Composición';
        toggleCompositionButton.classList.toggle('active', !isVisible);
    });

    toggleHistoryButton.addEventListener('click', () => {
        const isVisible = historySection.classList.contains('height-visible');
        historySection.classList.toggle('height-visible', !isVisible);
        historySection.classList.toggle('height-hidden', isVisible);
        toggleHistoryButton.textContent = isVisible ? 'Mostrar Histórico' : 'Ocultar Histórico';
        toggleHistoryButton.classList.toggle('active', !isVisible);
    });

    // Descargar datos
    downloadDataButton.addEventListener('click', () => {
        const data = JSON.stringify({ portfolio: portfolioData, performance: performanceData }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-data.json';
        a.click();
        URL.revokeObjectURL(url);
    });
});
