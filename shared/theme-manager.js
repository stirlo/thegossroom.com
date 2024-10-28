class ThemeManager {
    constructor() {
        this.themes = {
            'tech': {
                light: {
                    '--bg-color': '#f0f6ff',
                    '--text-color': '#2c3e50',
                    '--primary-color': '#3498db',
                    '--secondary-color': '#2980b9',
                    '--accent-color': '#fff'
                },
                dark: {
                    '--bg-color': '#1a1f36',
                    '--text-color': '#ecf0f1',
                    '--primary-color': '#2980b9',
                    '--secondary-color': '#3498db',
                    '--accent-color': '#2c2c2c'
                }
            },
            'tech-ai': {
                light: {
                    '--bg-color': '#f5f5f5',
                    '--text-color': '#2c3e50',
                    '--primary-color': '#6c5ce7',
                    '--secondary-color': '#5541d7',
                    '--accent-color': '#fff'
                },
                dark: {
                    '--bg-color': '#1a1a2e',
                    '--text-color': '#ecf0f1',
                    '--primary-color': '#5541d7',
                    '--secondary-color': '#6c5ce7',
                    '--accent-color': '#2c2c2c'
                }
            },
            'tech-mobile': {
                light: {
                    '--bg-color': '#fff5f5',
                    '--text-color': '#2d3436',
                    '--primary-color': '#e17055',
                    '--secondary-color': '#d63031',
                    '--accent-color': '#fff'
                },
                dark: {
                    '--bg-color': '#2d1f1f',
                    '--text-color': '#ecf0f1',
                    '--primary-color': '#d63031',
                    '--secondary-color': '#e17055',
                    '--accent-color': '#2c2c2c'
                }
            },
            'tech-auto': {
                light: {
                    '--bg-color': '#f7f7ff',
                    '--text-color': '#2d3436',
                    '--primary-color': '#0984e3',
                    '--secondary-color': '#0770c5',
                    '--accent-color': '#fff'
                },
                dark: {
                    '--bg-color': '#1f2937',
                    '--text-color': '#ecf0f1',
                    '--primary-color': '#0770c5',
                    '--secondary-color': '#0984e3',
                    '--accent-color': '#2c2c2c'
                }
            },
            'celebrity': {
                light: {
                    '--bg-color': '#F6E000',
                    '--text-color': '#BA38F2',
                    '--primary-color': '#FFA07D',
                    '--secondary-color': '#F2059F',
                    '--accent-color': '#AD05B3'
                },
                dark: {
                    '--bg-color': '#292929',
                    '--text-color': '#F205B3',
                    '--primary-color': '#4A1E4E',
                    '--secondary-color': '#F2C12E',
                    '--accent-color': '#D9886A'
                }
            },
            'climate': {
                light: {
                    '--bg-color': '#e8f5e9',
                    '--text-color': '#2e7d32',
                    '--primary-color': '#4caf50',
                    '--secondary-color': '#388e3c',
                    '--accent-color': '#81c784'
                },
                dark: {
                    '--bg-color': '#1b2820',
                    '--text-color': '#81c784',
                    '--primary-color': '#388e3c',
                    '--secondary-color': '#4caf50',
                    '--accent-color': '#2e7d32'
                }
            }
        };

        this.detectSection();
        this.initTheme();
    }

    detectSection() {
        const path = window.location.pathname;
        let section = 'default';

        if (path.includes('/tech/')) {
            if (path.includes('/tech/AI/')) {
                section = 'tech-ai';
            } else if (path.includes('/tech/mobile/')) {
                section = 'tech-mobile';
            } else if (path.includes('/tech/automotive/')) {
                section = 'tech-auto';
            } else {
                section = 'tech';
            }
        } else if (path.includes('/celebrity/')) {
            section = 'celebrity';
        } else if (path.includes('/climate/')) {
            section = 'climate';
        }

        this.currentSection = section;
        document.documentElement.setAttribute('data-section', section);
    }

    initTheme() {
        this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.darkModeMediaQuery.addListener((e) => this.updateTheme(e.matches));
        this.updateTheme(this.darkModeMediaQuery.matches);
    }

    updateTheme(isDark) {
        const mode = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', mode);

        const theme = this.themes[this.currentSection]?.[mode] || this.themes['default'][mode];
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

