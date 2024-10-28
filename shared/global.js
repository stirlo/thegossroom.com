// Global utility functions and shared functionality
const GossRoom = {
    // Date formatting
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    // Error handling
    handleError(error, element) {
        console.error(error);
        element.innerHTML = `
            <div class="error-message">
                <p>Something went wrong. Please try again later.</p>
            </div>
        `;
    },

    // Loading state
    showLoading(element) {
        element.classList.add('loading');
    },

    hideLoading(element) {
        element.classList.remove('loading');
    },

    // Data fetching with timeout and error handling
    async fetchData(url, timeout = 5000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
    },

    // Local storage helpers
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage error:', e);
            }
        },

        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage error:', e);
                return null;
            }
        }
    },

    // Analytics tracking (placeholder)
    track(eventName, properties = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Add class to body based on current path
    const path = window.location.pathname;
    document.body.classList.add(path.split('/')[1] || 'home');
});

