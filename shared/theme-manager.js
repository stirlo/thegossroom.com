class ThemeManager {
    static init() {
        this.setupThemeToggle();
        this.loadSavedTheme();
    }

    static setupThemeToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.innerHTML = '🌓';
        toggle.addEventListener('click', () => this.toggleTheme());
        document.querySelector('header').appendChild(toggle);
    }

    static loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    static toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Dispatch event for components to react
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
    }

    static getThemeColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            primary: computedStyle.getPropertyValue('--primary-color'),
            secondary: computedStyle.getPropertyValue('--secondary-color'),
            background: computedStyle.getPropertyValue('--background-color'),
            text: computedStyle.getPropertyValue('--text-color')
        };
    }
}

