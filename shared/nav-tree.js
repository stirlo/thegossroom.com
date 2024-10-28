class NavTree {
    constructor() {
        this.structure = siteStructure;
        this.currentPath = window.location.pathname;
    }

    generateBreadcrumbs() {
        const path = this.currentPath.split('/').filter(p => p);
        let html = '<nav class="breadcrumbs">';
        html += '<a href="/">Home</a>';

        let currentPath = '';
        path.forEach((segment, index) => {
            currentPath += `/${segment}`;
            html += ` > <a href="${currentPath}">${segment.charAt(0).toUpperCase() + segment.slice(1)}</a>`;
        });

        return html + '</nav>';
    }

    generateSectionNav() {
        const path = this.currentPath.split('/').filter(p => p);
        let currentSection = this.structure;

        path.forEach(segment => {
            currentSection = currentSection[segment] || {};
        });

        let html = '<nav class="section-nav">';
        if (currentSection.topics) {
            html += '<ul class="topic-list">';
            currentSection.topics.forEach(topic => {
                html += `<li><a href="#${topic.toLowerCase().replace(/\s+/g, '-')}">${topic}</a></li>`;
            });
            html += '</ul>';
        }

        return html + '</nav>';
    }
}

