import { fetchAccounts, fetchPortfolioData } from './api.js';
import { renderAccounts, renderPortfolio, renderPortfolioChart, renderComponentsChart, renderCompositionTable, renderHistoryTable, setPortfolioScale, setComponentsScale, downloadData } from './dom.js';
import { setError, clearMessages } from './utils.js';

let currentToken = null;

document.addEventListener('DOMContentLoaded', () => {
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    if (fetchAccountsButton) {
        fetchAccountsButton.addEventListener('click', async () => {
            const tokenInput = document.getElementById('api-token');
            const token = tokenInput.value.trim();
            if (!token) {
                setError('Por favor, introduce un token de API válido.');
                tokenInput.classList.remove('valid');
                tokenInput.classList.add('invalid');
                return;
            }
            currentToken = token;
            try {
                const { accounts, totalValue, totalReturn, totalContributions } = await fetchAccounts(token);
                renderAccounts(accounts, totalValue, totalReturn, totalContributions);
            } catch (error) {
                setError(`Error al cargar cuentas: ${error.message}. Reintentando en 3 segundos...`);
                setTimeout(async () => {
                    try {
                        const { accounts, totalValue, totalReturn, totalContributions } = await fetchAccounts(token);
                        renderAccounts(accounts, totalValue, totalReturn, totalContributions);
                    } catch (retryError) {
                        setError(`Error tras reintento: ${retryError.message}`);
                    }
                }, 3000);
            }
        });
    }

    const accountSelect = document.getElementById('account-select');
    if (accountSelect) {
        accountSelect.addEventListener('change', async () => {
            clearMessages();
            const accountId = accountSelect.value;
            if (accountId && currentToken) {
                try {
                    const { portfolioData, historyData } = await fetchPortfolioData(currentToken, accountId);
                    renderPortfolio(accountId, portfolioData, historyData);
                } catch (error) {
                    setError(`Error al cargar datos: ${error.message}. Reintentando en 3 segundos...`);
                    setTimeout(async () => {
                        try {
                            const { portfolioData, historyData } = await fetchPortfolioData(currentToken, accountId);
                            renderPortfolio(accountId, portfolioData, historyData);
                        } catch (retryError) {
                            setError(`Error tras reintento: ${retryError.message}`);
                        }
                    }, 3000);
                }
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
                setPortfolioScale(scale);
                document.getElementById('portfolio-euros').classList.toggle('active', scale === 'euros');
                document.getElementById('portfolio-percentage').classList.toggle('active', scale === 'percentage');
                renderPortfolioChart();
            } else if (chart === 'components') {
                setComponentsScale(scale);
                document.getElementById('components-euros').classList.toggle('active', scale === 'euros');
                document.getElementById('components-percentage').classList.toggle('active', scale === 'percentage');
                renderComponentsChart();
            }
        });
    });

    const downloadDataButton = document.getElementById('download-data');
    if (downloadDataButton) {
        downloadDataButton.addEventListener('click', () => {
            downloadData();
        });
    }
});
