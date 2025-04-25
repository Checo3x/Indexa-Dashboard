import { setLoading, setError, clearMessages } from './utils.js';

export async function fetchAccounts(token) {
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

        let totalValue = 0;
        let totalReturn = 0;
        let totalContributions = 0;
        const accountPromises = accounts.map(async account => {
            const portfolioResponse = await fetch(`/api/accounts/${account.account_number}/portfolio`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!portfolioResponse.ok) {
                const errorData = await portfolioResponse.json();
                throw new Error(`Error HTTP (portfolio): ${portfolioResponse.status} ${errorData.details || portfolioResponse.statusText}`);
            }
            const portfolioData = await portfolioResponse.json();
            const historyResponse = await fetch(`/api/accounts/${account.account_number}/performance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!historyResponse.ok) {
                const errorData = await historyResponse.json();
                throw new Error(`Error HTTP (performance): ${historyResponse.status} ${errorData.details || historyResponse.statusText}`);
            }
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

        return { accounts, totalValue, totalReturn, totalContributions };
    } catch (error) {
        setError(`Error al cargar cuentas: ${error.message}`);
        if (tokenInput) {
            tokenInput.classList.remove('valid');
            tokenInput.classList.add('invalid');
        }
        throw error;
    } finally {
        setLoading(false);
    }
}

export async function fetchPortfolioData(token, accountId) {
    setLoading(true);
    clearMessages();
    try {
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
        return { portfolioData, historyData };
    } catch (error) {
        setError(`Error al obtener datos: ${error.message}`);
        throw error;
    } finally {
        setLoading(false);
    }
}
