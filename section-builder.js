// section-builder.js
const fs = require('fs').promises;
const path = require('path');
const { sectionConfig } = require('./section-config');

async function buildSectionStructure(section) {
    const sectionPath = path.join('dist', section);
    const structure = {
        root: sectionPath,
        topics: path.join(sectionPath, 'topics'),
        feeds: path.join(sectionPath, 'feeds'),
        assets: path.join(sectionPath, 'assets'),
        templates: path.join(sectionPath, 'templates')
    };

    // Create directory structure
    for (const dir of Object.values(structure)) {
        await fs.mkdir(dir, { recursive: true });
    }

    // Create section index
    await fs.writeFile(
        path.join(sectionPath, 'index.html'),
        generateSectionIndex(section)
    );

    // Create section-specific styles
    await fs.writeFile(
        path.join(structure.assets, 'style.css'),
        generateSectionStyles(section)
    );

    return structure;
}

function generateSectionIndex(section) {
    const config = sectionConfig[section];
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - TheGossRoom</title>
    <link rel="stylesheet" href="/shared/global.css">
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <header>
        <nav id="main-nav"></nav>
        <div id="breadcrumbs"></div>
    </header>

    <main>
        <h1>${config.title}</h1>

        <section id="featured-topics">
            <h2>Popular Topics</h2>
            <div class="topic-grid"></div>
        </section>

        <section id="latest-articles">
            <h2>Latest Updates</h2>
            <div class="article-grid"></div>
        </section>

        <section id="trending">
            <h2>Trending Now</h2>
            <div class="trending-grid"></div>
        </section>
    </main>

    <footer id="site-footer"></footer>

    <script src="/shared/global.js"></script>
    <script src="/shared/nav-tree.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            loadTopics('${section}');
            loadArticles('${section}');
            loadTrending('${section}');
        });
    </script>
</body>
</html>
    `;
}

function generateSectionStyles(section) {
    return `
/* ${sectionConfig[section].title} specific styles */
:root {
    --section-primary: var(--${section}-primary, #333);
    --section-secondary: var(--${section}-secondary, #666);
    --section-accent: var(--${section}-accent, #999);
}

.topic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.article-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
}

.trending-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

/* Section-specific card styles */
.card {
    border-color: var(--section-primary);
}

.card:hover {
    box-shadow: 0 4px 12px var(--section-secondary);
}
    `;
}

// Export the builder
module.exports = {
    buildSectionStructure
};

