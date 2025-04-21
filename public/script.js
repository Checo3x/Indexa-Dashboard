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
    '#FF6B6B', // Coral
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul claro
    '#96CEB4', // Verde claro
    '#FFEEAD', // Amarillo claro
    '#D4A5A5', // Rosa suave
    '#9B59B6', // Púrpura
    '#3498DB', // Azul
    '#E74C3C', // Rojo
    '#2ECC71'  // Verde
];

// Colores específicos para las líneas de performance
const performanceColors = {
    real: '#4ECDC4', // Turquesa para el valor real
    expected: '#3498DB', // Azul para el valor esperado
    best: '#2ECC71', // Verde para el mejor escenario
    worst: '#E74C3C' // Rojo para el peor escenario
};

function createPortfolioChart(labels, datasets) {
    console.log('Datos para el gráfico total:', { labels, datasets });
    if (!labels.length || !datasets.length) {
        console.warn('No hay datos suficientes para mostrar en el gráfico total');
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
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Fecha' },
                        ticks: { maxTicksLimit: 10 }
                    },
                    y: {
                        title: { display: true, text: 'Valor (€)' },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        portfolioChart.update();
    } catch (error) {
        console.error('Error al crear el gráfico total:', error);
        setError('No se pudo renderizar el gráfico total. Por favor, revisa la consola para más detalles.');
    }
}

function createComponentsChart(labels, datasets) {
    console.log('Datos para el gráfico de componentes:', { labels, datasets });
    if (!labels.length || !datasets.length) {
        console.warn('No hay datos suficientes para mostrar en el gráfico de componentes');
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
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Fecha' },
                        ticks: { maxTicksLimit: 10 }
                    },
                    y: {
                        title: { display: true, text: 'Valor (€)' },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        componentsChart.update();
    } catch (error) {
        console.error('Error al crear el gráfico de componentes:', error);
        setError('No se pudo renderizar el gráfico de componentes. Por favor, revisa la consola para más detalles.');
    }
}

// Mostrar/ocultar indicador de carga
function setLoading(isLoading) {
    console.log('Ejecutando setLoading:', isLoading);
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.toggle('hidden', !isLoading);
    } else {
        console.error('Elemento con id "loading-indicator" no encontrado en el HTML');
    }
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    const fetchDataButton = document.getElementById('fetch-data');
    if (fetchAccountsButton) fetchAccountsButton.disabled = isLoading;
    if (fetchDataButton) fetchDataButton.disabled = isLoading;
}

// Mostrar mensaje de error
function setError(message) {
    console.log('Ejecutando setError:', message);
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        errorDiv.classList.add('block');
        errorDiv.style.display = 'block';
    } else {
        console.error('Elemento con id "error-message" no encontrado en el HTML');
    }
}

// Mostrar mensaje de advertencia
function setWarning(message) {
    console.log('Ejecutando setWarning:', message);
    const warningDiv = document.getElementById('warning-message');
    if (warningDiv) {
        warningDiv.textContent = message;
        warningDiv.classList.remove('hidden');
    } else {
        console.error('Elemento con id "warning-message" no encontrado en el HTML');
    }
}

// Obtener lista de cuentas
async function fetchAccounts(token) {
    console.log('Iniciando fetchAccounts');
    setLoading(true);
    try {
        console.log('Enviando solicitud fetch a /api/users/me');
        const response = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Respuesta recibida:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('Error en la respuesta:', errorData);
            throw new Error(`Error HTTP: ${response.status} ${errorData.details || response.statusText}`);
        }

        const userData = await response.json();
        console.log('Datos del usuario recibidos');

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
        } else {
            console.error('Elemento con id "account-select" no encontrado en el HTML');
        }

        const accountSelector = document.getElementById('account-selector');
        if (accountSelector) {
            accountSelector.classList.remove('hidden');
        } else {
            console.error('Elemento con id "account-selector" no encontrado en el HTML');
        }

        const errorMessage = document.getElementById('error-message');
        const warningMessage = document.getElementById('warning-message');
        if (errorMessage) errorMessage.classList.add('hidden');
        if (warningMessage) warningMessage.classList.add('hidden');
    } catch (error) {
        console.error('Error en fetchAccounts:', error);
        setError(`Error al cargar cuentas: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// Obtener datos de la cartera
async function fetchPortfolioData(token, accountId) {
    setLoading(true);
    try {
        // Mostrar el número de cuenta seleccionada
        const accountInfo = document.getElementById('account-info');
        const selectedAccount = document.getElementById('selected-account');
        if (accountInfo && selectedAccount) {
            selectedAccount.textContent = `Cuenta ${accountId}`;
            accountInfo.classList.remove('hidden');
        }

        // Obtener datos de la cartera
        const portfolioResponse = await fetch(`/api/accounts/${accountId}/portfolio`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!portfolioResponse.ok) {
            const errorData = await portfolioResponse.json();
            throw new Error(`Error HTTP (portfolio): ${portfolioResponse.status} ${errorData.details || portfolioResponse.statusText}`);
        }
        const portfolioData = await portfolioResponse.json();
        console.log('Datos de cartera (portfolioData):', portfolioData);

        // Obtener datos históricos
        const historyResponse = await fetch(`/api/accounts/${accountId}/performance`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!historyResponse.ok) {
            const errorData = await historyResponse.json();
            throw new Error(`Error HTTP (performance): ${historyResponse.status} ${errorData.details || historyResponse.statusText}`);
        }
        const historyData = await historyResponse.json();
        console.log('Datos históricos completos (historyData):', historyData);
        console.log('historyData.performance:', historyData.performance);
        console.log('historyData.portfolios:', historyData.portfolios);

        // Intentar obtener los componentes desde instrument_accounts o comparison
        let components = [];
        if (portfolioData.portfolio?.cash_accounts?.[0]?.instrument_accounts) {
            components = portfolioData.portfolio.cash_accounts[0].instrument_accounts;
            console.log('Componentes obtenidos desde instrument_accounts:', components);
        } else if (portfolioData.comparison) {
            components = portfolioData.comparison;
            console.log('Componentes obtenidos desde comparison:', components);
        } else {
            console.warn('No se encontraron componentes en instrument_accounts ni en comparison');
        }

        console.log('Componentes de la cartera:', components);

        // Calcular el valor total de la cartera
        let totalValue = components.reduce((sum, component) => sum + (component.amount || 0), 0);
        if (totalValue === 0 && portfolioData.portfolio?.total_amount) {
            totalValue = portfolioData.portfolio.total_amount;
            console.log('Total value obtenido desde portfolio.total_amount:', totalValue);
        }
        console.log('totalValue (calculado):', totalValue);

        let additionalCashNeeded = portfolioData.extra?.additional_cash_needed_to_trade ?? 0;
        console.log('additionalCashNeeded:', additionalCashNeeded);

        const annualReturn = (historyData.return?.time_return_annual || historyData.plan_expected_return || 0) * 100;
        const volatility = 0; // Ignorado por ahora

        // Actualizar métricas en el frontend
        const totalValueElement = document.getElementById('total-value');
        if (totalValueElement) {
            totalValueElement.textContent = `€${totalValue.toFixed(2)}`;
        } else {
            console.error('Elemento con id "total-value" no encontrado en el HTML');
        }

        const annualReturnElement = document.getElementById('annual-return');
        if (annualReturnElement) {
            annualReturnElement.textContent = `${annualReturn.toFixed(2)}%`;
        } else {
            console.error('Elemento con id "annual-return" no encontrado en el HTML');
        }

        const volatilityElement = document.getElementById('volatility');
        if (volatilityElement) {
            volatilityElement.textContent = `${volatility.toFixed(2)}%`;
        } else {
            console.error('Elemento con id "volatility" no encontrado en el HTML');
        }

        const additionalCashElement = document.getElementById('additional-cash-needed');
        if (additionalCashElement) {
            additionalCashElement.textContent = `€${additionalCashNeeded.toFixed(2)}`;
        } else {
            console.error('Elemento con id "additional-cash-needed" no encontrado en el HTML');
        }

        // Procesar datos de performance para el gráfico total
        let labels = [];
        let realValues = [];
        let expectedValues = [];
        let bestValues = [];
        let worstValues = [];

        if (historyData.performance && historyData.performance.period) {
            const periods = historyData.performance.period;
            let realData = historyData.performance.real || [];
            const expectedData = historyData.performance.expected_return || [];
            const bestData = historyData.performance.best_return || [];
            const worstData = historyData.performance.worst_return || [];

            console.log('periods:', periods);
            console.log('realData (antes de procesar):', realData);
            console.log('expectedData:', expectedData);
            console.log('bestData:', bestData);
            console.log('worstData:', worstData);

            // Manejar el caso en que realData no sea un array
            if (!Array.isArray(realData)) {
                console.warn('realData no es un array, se recibió:', realData);
                if (typeof realData === 'number') {
                    realData = [[0, realData]]; // Convertimos a un array con el primer índice
                } else {
                    realData = []; // Si no es un array ni un número, lo tratamos como vacío
                }
                console.log('realData (después de ajustar):', realData);
            }

            // Obtener el valor inicial de la cartera desde el primer valor de "real"
            const initialValue = realData.length > 0 && realData[0][1] ? realData[0][1] : 100;
            console.log('initialValue:', initialValue);

            const scalingFactor = totalValue / initialValue; // Escalar los valores para que coincidan con totalValue
            console.log('scalingFactor:', scalingFactor);

            // Mapear las etiquetas (fechas como cadenas)
            labels = periods.map(periodEntry => {
                const dateStr = periodEntry[1]?.split(' ')[0] || 'N/A';
                const date = new Date(dateStr);
                return isNaN(date) ? 'N/A' : dateStr;
            });

            // Mapear los datos reales directamente
            realValues = new Array(periods.length).fill(null);
            realData.forEach(([index, value]) => {
                const idx = parseInt(index, 10);
                if (idx >= 0 && idx < periods.length) {
                    realValues[idx] = Number(value) * scalingFactor;
                }
            });
            console.log('realValues (después de mapear):', realValues);

            // Filtrar períodos donde hay datos reales
            const validIndices = realValues.map((val, idx) => {
                const isValid = val !== null;
                console.log(`validIndices[${idx}]: val=${val}, isValid=${isValid}`);
                return isValid ? idx : -1;
            }).filter(idx => idx !== -1);
            console.log('validIndices:', validIndices);

            if (validIndices.length === 0) {
                console.warn('No hay datos reales disponibles; usando totalValue como respaldo');
                labels = [new Date().toISOString().split('T')[0]];
                realValues = [totalValue || 0];
                expectedValues = [totalValue || 0];
                bestValues = [totalValue || 0];
                worstValues = [totalValue || 0];
            } else {
                labels = validIndices.map(idx => labels[idx]);
                realValues = validIndices.map(idx => realValues[idx]);

                // Calcular valores esperados, mejores y peores (en euros)
                let cumulativeExpected = initialValue;
                let cumulativeBest = initialValue;
                let cumulativeWorst = initialValue;

                expectedValues = periods.map((_, index) => {
                    const entry = expectedData.find(item => item[0] === index);
                    if (entry) {
                        const returnRate = entry[1];
                        cumulativeExpected *= (1 + returnRate);
                        return cumulativeExpected * scalingFactor;
                    }
                    return initialValue * scalingFactor;
                });

                bestValues = periods.map((_, index) => {
                    const entry = bestData.find(item => item[0] === index);
                    if (entry) {
                        const returnRate = entry[1];
                        cumulativeBest *= (1 + returnRate);
                        return cumulativeBest * scalingFactor;
                    }
                    return initialValue * scalingFactor;
                });

                worstValues = periods.map((_, index) => {
                    const entry = worstData.find(item => item[0] === index);
                    if (entry) {
                        const returnRate = entry[1];
                        cumulativeWorst *= (1 + returnRate);
                        return cumulativeWorst * scalingFactor;
                    }
                    return initialValue * scalingFactor;
                });

                // Filtrar para los índices válidos
                expectedValues = validIndices.map(idx => expectedValues[idx]);
                bestValues = validIndices.map(idx => bestValues[idx]);
                worstValues = validIndices.map(idx => worstValues[idx]);
            }

            console.log('Datos procesados para el gráfico total:', {
                labels,
                realValues,
                expectedValues,
                bestValues,
                worstValues
            });
        } else {
            console.warn('historyData.performance no está disponible; intentando con portfolios');
            // Fallback a portfolios si performance no está disponible
            const portfolioHistory = historyData.portfolios || [];
            console.log('portfolioHistory:', portfolioHistory);

            let historicalData = portfolioHistory.map(item => ({
                date: item.date || 'N/A',
                value: Number(item.total_amount || 0)
            }));

            // Filtrar datos con valor 0
            if (historicalData.length > 0) {
                historicalData = historicalData.filter(item => item.value > 0 && item.date !== 'N/A');
            }

            // Ordenar datos por fecha
            if (historicalData.length > 0) {
                historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            labels = historicalData.map(item => item.date);
            realValues = historicalData.map(item => item.value);

            // Si no hay datos históricos, usar totalValue como respaldo
            if (realValues.length === 0) {
                console.warn('No hay datos históricos en portfolios; usando totalValue como respaldo');
                labels = [new Date().toISOString().split('T')[0]];
                realValues = [totalValue || 0];
            }

            console.log('Datos procesados desde portfolios:', { labels, realValues });
        }

        // Crear datasets para el gráfico total
        const datasets = [];
        if (realValues.length > 0) {
            datasets.push({
                label: 'Real (€)',
                data: realValues,
                borderColor: performanceColors.real,
                tension: 0.1,
                fill: false
            });
        }
        if (expectedValues.length > 0) {
            datasets.push({
                label: 'Esperado (€)',
                data: expectedValues,
                borderColor: performanceColors.expected,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false
            });
        }
        if (bestValues.length > 0) {
            datasets.push({
                label: 'Mejor Escenario (€)',
                data: bestValues,
                borderColor: performanceColors.best,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false
            });
        }
        if (worstValues.length > 0) {
            datasets.push({
                label: 'Peor Escenario (€)',
                data: worstValues,
                borderColor: performanceColors.worst,
                borderDash: [5, 5],
                tension: 0.1,
                fill: false
            });
        }

        // Renderizar el gráfico total incluso con datos mínimos
        createPortfolioChart(labels, datasets);

        // Calcular los pesos reales de los fondos y asignar colores
        const weights = components.map((component, index) => {
            const weight = component.weight_real || (totalValue > 0 ? (component.amount || 0) / totalValue : 0);
            const name = component.instrument?.name || component.instrument?.identifier_name || component.instrument?.description || `Fondo ${index + 1}`;
            const color = colorPalette[index % colorPalette.length];
            console.log(`Componente ${index}:`, component);
            console.log(`Nombre del fondo (componente ${index}):`, component.instrument?.name, 'Nombre asignado:', name);
            return {
                name: name,
                amount: component.amount || 0,
                weight: weight,
                color: color
            };
        });
        console.log('Pesos reales de los fondos:', weights);

        // Llenar la tabla de composición con colores
        const compositionTable = document.getElementById('composition-table');
        if (compositionTable) {
            compositionTable.innerHTML = '';
            if (weights.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="4" class="p-2 text-center">No hay datos de composición disponibles</td>`;
                compositionTable.appendChild(row);
            } else {
                weights.forEach(fund => {
                    console.log('Añadiendo fondo a la tabla:', fund.name, 'con color:', fund.color);
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
        } else {
            console.error('Elemento con id "composition-table" no encontrado en el HTML');
        }

        // Preparar datos para el gráfico de componentes
        const componentDatasets = [];
        if (realValues.length > 0) {
            componentDatasets.push({
                label: 'Total Cartera (€)',
                data: realValues,
                borderColor: performanceColors.real,
                tension: 0.1,
                fill: false
            });
        }

        // Calcular la evolución de cada fondo con su color asignado
        weights.forEach(fund => {
            const weight = fund.weight || 0;
            const name = fund.name;
            const color = fund.color;
            console.log('Creando dataset para fondo:', name, 'con peso:', weight, 'y color:', color);
            const componentValues = realValues.map(value => value * weight);
            componentDatasets.push({
                label: `${name} (€)`,
                data: componentValues,
                borderColor: color,
                tension: 0.1,
                fill: false
            });
        });

        // Renderizar el gráfico de componentes incluso con datos mínimos
        if (componentDatasets.length > 0) {
            createComponentsChart(labels, componentDatasets);
        } else {
            console.warn('No hay datos de componentes para mostrar en el gráfico');
            setWarning('No hay datos de componentes para mostrar en el gráfico. Revisa la estructura de los datos de la API.');
        }

        // Calcular rentabilidad para la tabla histórica
        const tableData = realValues.map((value, index) => {
            let returnPercentage = 0;
            if (index > 0) {
                const previousValue = realValues[index - 1];
                returnPercentage = ((value - previousValue) / previousValue) * 100;
            }
            return {
                date: labels[index] || 'N/A',
                value: value,
                return: returnPercentage
            };
        });

        // Actualizar tabla para mostrar las últimas 10 entradas
        const tableBody = document.getElementById('history-table');
        if (tableBody) {
            tableBody.innerHTML = '';
            if (tableData.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="3" class="p-2 text-center">No hay datos históricos disponibles</td>`;
                tableBody.appendChild(row);
            } else {
                const recentData = tableData.slice(-10);
                recentData.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="p-2">${item.date}</td>
                        <td class="p-2">€${(item.value || 0).toFixed(2)}</td>
                        <td class="p-2">${(item.return || 0).toFixed(2)}%</td>
                    `;
                    tableBody.appendChild(row);
                });

                if (tableData.length > 10) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="3" class="p-2 text-center text-gray-500">Mostrando las últimas 10 entradas de ${tableData.length} disponibles</td>`;
                    tableBody.appendChild(row);
                }
            }
        } else {
            console.error('Elemento con id "history-table" no encontrado en el HTML');
        }

        document.getElementById('error-message').classList.add('hidden');
        document.getElementById('warning-message').classList.add('hidden');
    } catch (error) {
        console.error('Error al obtener datos:', error);
        setError(`Error al obtener datos: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// Evento para cargar cuentas
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado. Registrando eventos...');
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    if (fetchAccountsButton) {
        console.log('Botón fetch-accounts encontrado. Registrando evento click.');
        fetchAccountsButton.addEventListener('click', () => {
            console.log('Botón "Cargar Cuentas" clicado.');
            const token = document.getElementById('api-token').value.trim();
            console.log('Token ingresado (longitud):', token.length);
            if (!token) {
                console.log('Token vacío. Mostrando error.');
                setError('Por favor, introduce un token de API válido.');
                return;
            }
            console.log('Token válido. Ejecutando fetchAccounts...');
            fetchAccounts(token);
        });
    } else {
        console.error('Elemento con id "fetch-accounts" no encontrado en el HTML');
    }

    // Evento para obtener datos de la cartera
    const fetchDataButton = document.getElementById('fetch-data');
    if (fetchDataButton) {
        fetchDataButton.addEventListener('click', () => {
            console.log('Botón "Obtener Datos" clicado.');
            const token = document.getElementById('api-token').value.trim();
            if (!token) {
                console.log('Token vacío. Mostrando error.');
                setError('Por favor, introduce un token de API válido.');
                return;
            }
            const accountId = document.getElementById('account-select').value;
            if (!accountId) {
                setError('Por favor, selecciona una cuenta.');
                return;
            }
            fetchPortfolioData(token, accountId);
        });
    } else {
        console.error('Elemento con id "fetch-data" no encontrado en el HTML');
    }
});
