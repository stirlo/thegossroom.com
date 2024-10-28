// Global constants and configurations
const CONFIG = {
    API_BASE_URL: 'https://api.thegossroom.com',
    CACHE_DURATION: 1800000, // 30 minutes in milliseconds
    MAX_RETRIES: 3,
    ANIMATION_DURATION: 300,
    DEBUG_MODE: false
};

// Utility functions
const utils = {
    // Date formatting
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Safe JSON parsing
    safeJSONParse: (str) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return null;
        }
    },

    // Local storage helpers
    storage: {
        set: (key, value, expirationInMs = CONFIG.CACHE_DURATION) => {
            const item = {
                value: value,
                timestamp: new Date().getTime(),
                expires: new Date().getTime() + expirationInMs
            };
            localStorage.setItem(key, JSON.stringify(item));
        },

        get: (key) => {
            const item = utils.safeJSONParse(localStorage.getItem(key));
            if (!item) return null;
            if (new Date().getTime() > item.expires) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        },

        clear: (key) => {
            if (key) {
                localStorage.removeItem(key);
            } else {
                localStorage.clear();
            }
        }
    },

    // DOM helpers
    dom: {
        create: (tag, className = '', innerHTML = '') => {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (innerHTML) element.innerHTML = innerHTML;
            return element;
        },

        setLoading: (element, isLoading) => {
            if (isLoading) {
                element.classList.add('loading');
            } else {
                element.classList.remove('loading');
            }
        }
    },

    // Error handling
    handleError: (error, context = '') => {
        console.error(`Error in ${context}:`, error);
        if (CONFIG.DEBUG_MODE) {
            alert(`Error in ${context}: ${error.message}`);
        }
    }
};

// Core functionality
class CoreFunctionality {
    constructor() {
        this.initializeComponents();
        this.setupEventListeners();
    }

    initializeComponents() {
        // Set current year in footer
        const currentYearSpan = document.getElementById('currentYear');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        // Initialize theme manager if present
        if (window.themeManager) {
            window.themeManager.init();
        }

        // Setup navigation highlighting
        this.highlightCurrentNavItem();
    }

    setupEventListeners() {
        // Global event delegation
        document.addEventListener('click', (e) => {
            // Handle special link behaviors
            if (e.target.matches('a[data-action]')) {
                const action = e.target.getAttribute('data-action');
                this.handleAction(action, e);
            }
        });

        // Handle scroll-based animations
        window.addEventListener('scroll', this.handleScroll.bind(this), {
            passive: true
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    highlightCurrentNavItem() {
        const currentPath = window.location.pathname;
        document.querySelectorAll('.main-nav a').forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('current');
            }
        });
    }

    handleAction(action, event) {
        switch (action) {
            case 'scroll-top':
                event.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                break;
            // Add more action handlers as needed
        }
    }

    handleScroll() {
        // Add scroll-based functionality
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Show/hide scroll-to-top button if it exists
        const scrollTopButton = document.querySelector('.scroll-top-button');
        if (scrollTopButton) {
            scrollTopButton.style.display = scrollTop > 600 ? 'block' : 'none';
        }
    }

    handleResize() {
        // Handle responsive adjustments
        const width = window.innerWidth;
        document.body.classList.toggle('mobile', width < 768);
        document.body.classList.toggle('tablet', width >= 768 && width < 1024);
        document.body.classList.toggle('desktop', width >= 1024);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.core = new CoreFunctionality();

    // Initialize any section-specific functionality
    const section = document.body.getAttribute('data-section');
    if (section && window[`init${section.charAt(0).toUpperCase() + section.slice(1)}`]) {
        window[`init${section.charAt(0).toUpperCase() + section.slice(1)}`]();
    }
});

// Export utilities for use in other scripts
window.utils = utils;
window.CONFIG = CONFIG;

