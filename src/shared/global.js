document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Initialize navigation
    initializeNavigation();

    // Initialize lazy loading
    initializeLazyLoading();

    // Initialize dark mode toggle if present
    initializeDarkMode();
});

function initializeNavigation() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // Load navigation tree
    fetch('/shared/nav-tree.js')
        .then(response => response.json())
        .then(navTree => {
            nav.innerHTML = generateNavHTML(navTree);
            initializeNavListeners();
        })
        .catch(error => console.error('Error loading navigation:', error));
}

function generateNavHTML(navTree) {
    return `
        <div class="nav-container container">
            <a href="/" class="nav-logo">TheGossRoom</a>
            <button class="nav-toggle" aria-label="Toggle navigation">
                <span></span>
            </button>
            <ul class="nav-menu">
                ${generateNavItems(navTree)}
            </ul>
        </div>
    `;
}

function generateNavItems(items) {
    return items.map(item => `
        <li class="nav-item${item.children ? ' has-dropdown' : ''}">
            <a href="${item.url}">${item.label}</a>
            ${item.children ? `
                <ul class="dropdown-menu">
                    ${generateNavItems(item.children)}
                </ul>
            ` : ''}
        </li>
    `).join('');
}

function initializeNavListeners() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-menu') && !e.target.closest('.nav-toggle')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}

function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;

    // Check for saved user preference, first in localStorage, then in system preferences
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    darkModeToggle.checked = savedTheme === 'dark';

    // Add event listener for theme toggle
    darkModeToggle.addEventListener('change', () => {
        const theme = darkModeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Export utilities for use in other scripts
window.utils = {
    debounce,
    formatDate
};

