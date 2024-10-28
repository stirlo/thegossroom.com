// Import the AttributionManager
import { AttributionManager } from './shared/attribution-manager.js';

document.addEventListener('DOMContentLoaded', async function() {
    const manager = new AttributionManager();

    // Initialize source validation system
    const validator = new SourceValidator();

    // Initialize visualization system
    const visualizer = new SourceVisualizer();

    try {
        // Load and validate all sources
        await manager.init();
        await validator.validateAllSources(manager.getAllSources());

        // Create visualizations
        visualizer.createDistributionChart('sourceDistribution');
        visualizer.createStatusDashboard('sourceStatus');

        // Set up automated checking
        initializeAutomatedChecking(manager, validator);

    } catch (error) {
        console.error('Attribution system initialization error:', error);
        handleInitializationError();
    }

    // Original attribution.js functionality maintained for backwards compatibility
    // Fetch and populate the source list
    fetch('rss.txt')
        .then(response => response.text())
        .then(data => {
            const sources = data.split('\n').filter(line => line.trim() !== '');
            const sourceList = document.getElementById('sourceList');
            sources.forEach(source => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = new URL(source).origin;
                a.textContent = new URL(source).hostname.replace('www.', '');
                a.target = '_blank';
                li.appendChild(a);
                sourceList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching RSS sources:', error);
            document.getElementById('sourceList').innerHTML = 
                '<li>Unable to load sources. Please try again later.</li>';
        });

    // Fetch and populate the thank you list
    fetch('thankyou.txt')
        .then(response => response.text())
        .then(data => {
            const items = data.split('\n').filter(line => line.trim() !== '');
            const thankYouList = document.getElementById('thankYouList');
            items.forEach(item => {
                const li = document.createElement('li');
                const match = item.match(/(.*) by \[(.*)\]\((.*)\)/);

                if (match) {
                    const [, product, company, url] = match;
                    const a = document.createElement('a');
                    a.href = url;
                    a.textContent = company;
                    a.target = '_blank';
                    li.textContent = `${product} by `;
                    li.appendChild(a);
                } else {
                    li.textContent = item;
                }

                thankYouList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching thank you list:', error);
            document.getElementById('thankYouList').innerHTML = 
                '<li>Unable to load thank you list. Please try again later.</li>';
        });
});

// Source Validation System
class SourceValidator {
    constructor() {
        this.validationResults = new Map();
    }

    async validateSource(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return this.isValidRSS(text);
        } catch (error) {
            return false;
        }
    }

    isValidRSS(content) {
        // Basic RSS validation
        return content.includes('<rss') || 
               content.includes('<feed') || 
               content.includes('<atom');
    }

    async validateAllSources(sources) {
        const results = await Promise.allSettled(
            sources.map(async source => {
                const isValid = await this.validateSource(source.url);
                this.validationResults.set(source.url, isValid);
                return { url: source.url, isValid };
            })
        );
        return results;
    }
}

// Source Visualization System
class SourceVisualizer {
    createDistributionChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Using Chart.js for visualization
        const ctx = container.getContext('2d');
        new Chart(ctx, {
            type: 'treemap',
            data: this.prepareDistributionData(),
            options: this.getChartOptions()
        });
    }

    createStatusDashboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create status indicators
        const statusHTML = this.generateStatusHTML();
        container.innerHTML = statusHTML;
    }

    prepareDistributionData() {
        // Transform source data into visualization format
        // Implementation details to follow
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            // Additional chart options
        };
    }
}

// Automated Source Checking
function initializeAutomatedChecking(manager, validator) {
    // Set up periodic checking
    setInterval(async () => {
        const sources = manager.getAllSources();
        const results = await validator.validateAllSources(sources);
        updateStatusDisplay(results);
    }, 3600000); // Check every hour
}

function updateStatusDisplay(results) {
    const statusContainer = document.getElementById('sourceStatus');
    if (!statusContainer) return;

    // Update status indicators
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            const indicator = document.querySelector(
                `[data-source="${result.value.url}"]`
            );
            if (indicator) {
                indicator.className = `status-indicator ${
                    result.value.isValid ? 'active' : 'inactive'
                }`;
            }
        }
    });
}

function handleInitializationError() {
    const containers = [
        'sourceList',
        'sourceDistribution',
        'sourceStatus'
    ];

    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    System initialization failed. Please try again later.
                </div>
            `;
        }
    });
}

