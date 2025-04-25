export function formatDateToDayMonthYear(dateStr) {
    const date = new Date(dateStr.split(' ')[0]);
    return isNaN(date) ? 'Unknown' : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateToMonthYear(dateStr) {
    const date = new Date(dateStr.split(' ')[0]);
    return isNaN(date) ? 'Unknown' : date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

export function setLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const fetchAccountsButton = document.getElementById('fetch-accounts');
    const downloadDataButton = document.getElementById('download-data');
    if (loadingIndicator) {
        loadingIndicator.classList.toggle('fade-hidden', !isLoading);
        loadingIndicator.classList.toggle('fade-visible', isLoading);
    }
    if (fetchAccountsButton) fetchAccountsButton.disabled = isLoading;
    if (downloadDataButton) downloadDataButton.disabled = isLoading;
}

export function setError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('fade-hidden');
        errorDiv.classList.add('fade-visible');
    }
}

export function setWarning(message) {
    const warningDiv = document.getElementById('warning-message');
    if (warningDiv) {
        warningDiv.textContent = message;
        warningDiv.classList.remove('fade-hidden');
        warningDiv.classList.add('fade-visible');
    }
}

export function clearMessages() {
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
