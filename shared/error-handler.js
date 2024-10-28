class ErrorHandler {
    static init() {
        window.onerror = this.handleGlobalError.bind(this);
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    static handleGlobalError(message, source, line, column, error) {
        this.logError({
            type: 'global',
            message,
            source,
            line,
            column,
            stack: error?.stack
        });
        this.showErrorUI('An unexpected error occurred');
    }

    static handlePromiseRejection(event) {
        this.logError({
            type: 'promise',
            message: event.reason?.message || 'Promise rejected',
            stack: event.reason?.stack
        });
    }

    static handleAPIError(error, fallbackUI = null) {
        this.logError({
            type: 'api',
            message: error.message,
            status: error.status,
            endpoint: error.endpoint
        });

        if (fallbackUI) {
            return this.getFallbackContent(fallbackUI);
        }
        return this.getDefaultErrorMessage();
    }

    static logError(errorData) {
        console.error('Error occurred:', errorData);
        // Could be extended to send to error tracking service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'error', {
                error_type: errorData.type,
                error_message: errorData.message
            });
        }
    }

    static showErrorUI(message, container = null) {
        const errorHTML = `
            <div class="error-container">
                <div class="error-message">
                    <h3>Oops!</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()">Try Again</button>
                </div>
            </div>
        `;

        if (container) {
            container.innerHTML = errorHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', errorHTML);
        }
    }

    static getFallbackContent(type) {
        const fallbackContent = {
            articles: '<div class="fallback">Unable to load articles. Please try again later.</div>',
            topics: '<div class="fallback">Topics temporarily unavailable.</div>',
            feed: '<div class="fallback">Feed content unavailable.</div>'
        };
        return fallbackContent[type] || this.getDefaultErrorMessage();
    }

    static getDefaultErrorMessage() {
        return '<div class="error-message">Something went wrong. Please try again later.</div>';
    }
}

