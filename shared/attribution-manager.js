class AttributionManager {
    constructor() {
        this.sources = new Map();
        this.baseDirectories = [
            // Tech Category
            'tech/AI',
            'tech/automotive/ev',
            'tech/automotive/engines',
            'tech/automotive/future',
            'tech/software/development',
            'tech/software/apps',
            'tech/mobile/apple',
            'tech/mobile/android',
            'tech/mobile/emerging',
            'tech/audio/hardware',
            'tech/audio/production',
            'tech/audio/innovation',
            'tech/security/cybersecurity',
            'tech/security/privacy',
            'tech/security/enterprise',
            'tech/gaming/hardware',
            'tech/gaming/development',
            'tech/gaming/vr-ar',
            'tech/gaming/industry',
            'tech/chips/processors',
            'tech/chips/gpu',
            'tech/chips/manufacturing',
            'tech/space-tech/satellites',
            'tech/space-tech/exploration',
            'tech/space-tech/commercial',

            // Climate Category
            'climate/research/current',
            'climate/research/upcoming',
            'climate/impacts/current',
            'climate/impacts/predictions',
            'climate/impacts/regional',
            'climate/solutions/technology',
            'climate/solutions/policy',
            'climate/solutions/innovation',
            'climate/energy/renewable',
            'climate/energy/storage',
            'climate/energy/grid',
            'climate/conservation/biodiversity',
            'climate/conservation/oceans',
            'climate/conservation/forests',
            'climate/policy/international',
            'climate/policy/legislation',
            'climate/policy/agreements'
        ];
        this.rootSources = [];
        this.thankYouItems = [];
    }

    async init() {
        await Promise.all([
            this.loadRootSources(),
            this.loadAllSources(),
            this.loadThankYouList()
        ]);
        this.renderAttribution();
    }

    async loadRootSources() {
        try {
            const response = await fetch('/rss.txt');
            if (response.ok) {
                const text = await response.text();
                this.rootSources = text.split('\n').filter(line => line.trim());
            }
        } catch (error) {
            console.warn('Failed to load root sources:', error);
        }
    }

    async loadThankYouList() {
        try {
            const response = await fetch('/thankyou.txt');
            if (response.ok) {
                const text = await response.text();
                this.thankYouItems = text.split('\n').filter(line => line.trim());
            }
        } catch (error) {
            console.warn('Failed to load thank you list:', error);
        }
    }

    async loadAllSources() {
        for (const dir of this.baseDirectories) {
            try {
                const response = await fetch(`/${dir}/rss.txt`);
                if (response.ok) {
                    const text = await response.text();
                    const sources = this.parseRSSUrls(text);
                    this.sources.set(dir, sources);
                }
            } catch (error) {
                console.warn(`Failed to load sources for ${dir}:`, error);
            }
        }
    }

    parseRSSUrls(text) {
        return text
            .split('\n')
            .filter(line => line.trim())
            .map(url => {
                try {
                    const hostname = new URL(url).hostname;
                    return {
                        url: url,
                        name: this.formatSourceName(hostname),
                        category: this.getCategoryFromHostname(hostname)
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(source => source !== null);
    }

    formatSourceName(hostname) {
        return hostname
            .replace(/^www\.|\.com$|\.org$|\.net$/g, '')
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getCategoryFromHostname(hostname) {
        const categoryMap = {
            // Tech News
            'techcrunch.com': 'Technology News',
            'theverge.com': 'Technology News',
            'wired.com': 'Technology News',
            'arstechnica.com': 'Technology News',

            // AI & ML
            'arxiv.org': 'AI Research',
            'openai.com': 'AI Development',
            'deepmind.com': 'AI Research',

            // Automotive
            'motortrend.com': 'Automotive News',
            'caranddriver.com': 'Automotive News',
            'electrek.co': 'Electric Vehicles',

            // Mobile
            'gsmarena.com': 'Mobile Technology',
            '9to5mac.com': 'Apple News',
            'androidauthority.com': 'Android News',

            // Gaming
            'polygon.com': 'Gaming News',
            'ign.com': 'Gaming News',
            'eurogamer.net': 'Gaming News',

            // Climate & Environment
            'nature.com': 'Scientific Research',
            'sciencedaily.com': 'Science News',
            'climatechangenews.com': 'Climate News',

            // Space
            'space.com': 'Space News',
            'nasaspaceflight.com': 'Space Technology',
            'spaceflightnow.com': 'Space Exploration'
        };

        return categoryMap[hostname] || 'News and Updates';
    }

    renderAttribution() {
        const sourceList = document.getElementById('sourceList');
        const thankYouList = document.getElementById('thankYouList');

        if (!sourceList || !thankYouList) return;

        // Render root sources (maintaining original format)
        this.rootSources.forEach(source => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = new URL(source).origin;
            a.textContent = new URL(source).hostname.replace('www.', '');
            a.target = '_blank';
            li.appendChild(a);
            sourceList.appendChild(li);
        });

        // Render categorized sources from subfolders
        let categoryHtml = '';
        const categorizedSources = new Map();

        this.sources.forEach((sources, directory) => {
            sources.forEach(source => {
                if (!categorizedSources.has(source.category)) {
                    categorizedSources.set(source.category, []);
                }
                categorizedSources.get(source.category).push({
                    ...source,
                    directory
                });
            });
        });

        categorizedSources.forEach((sources, category) => {
            categoryHtml += `
                <li class="category-section">
                    <h3>${category}</h3>
                    <ul class="source-list">
                        ${sources.map(source => `
                            <li class="source-item">
                                <a href="${source.url}" target="_blank" rel="noopener noreferrer">
                                    ${source.name}
                                </a>
                                <span class="directory-tag">${source.directory}</span>
                            </li>
                        `).join('')}
                    </ul>
                </li>
            `;
        });

        sourceList.innerHTML += categoryHtml;

        // Render thank you list (maintaining original format)
        this.thankYouItems.forEach(item => {
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
    }

    static async loadSourcesForSection(sectionPath) {
        try {
            const response = await fetch(`/${sectionPath}/rss.txt`);
            if (response.ok) {
                const text = await response.text();
                return text.split('\n').filter(line => line.trim());
            }
            return [];
        } catch (error) {
            console.error(`Failed to load sources for ${sectionPath}:`, error);
            return [];
        }
    }
}

// Usage
document.addEventListener('DOMContentLoaded', async () => {
    const attributionManager = new AttributionManager();
    await attributionManager.init();
});

