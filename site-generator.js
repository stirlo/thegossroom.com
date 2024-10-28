// enhanced-site-generator.js
const fs = require('fs').promises;
const path = require('path');

// Define the complete structure with custom properties
const fullSiteStructure = {
    climate: {
        research: {
            current: { theme: 'science' },
            upcoming: { theme: 'future' }
        },
        energy: {
            renewable: { theme: 'green' },
            storage: { theme: 'tech' },
            grid: { theme: 'infrastructure' }
        },
        impacts: {
            current: { theme: 'alert' },
            regional: { theme: 'geo' },
            predictions: { theme: 'forecast' }
        },
        solutions: {
            innovation: { theme: 'bright' },
            technology: { theme: 'tech' },
            policy: { theme: 'formal' }
        },
        conservation: {
            biodiversity: { theme: 'nature' },
            oceans: { theme: 'water' },
            forests: { theme: 'earth' }
        },
        policy: {
            agreements: { theme: 'formal' },
            legislation: { theme: 'legal' },
            international: { theme: 'global' }
        }
    },
    tech: {
        gaming: {
            hardware: { theme: 'tech' },
            'vr-ar': { theme: 'future' },
            development: { theme: 'code' },
            industry: { theme: 'business' }
        },
        chips: {
            gpu: { theme: 'tech' },
            manufacturing: { theme: 'industrial' },
            processors: { theme: 'tech' }
        },
        security: {
            cybersecurity: { theme: 'dark' },
            privacy: { theme: 'secure' },
            enterprise: { theme: 'business' }
        },
        'space-tech': {
            satellites: { theme: 'space' },
            commercial: { theme: 'business' },
            exploration: { theme: 'discovery' }
        },
        automotive: {
            ev: { theme: 'future' },
            engines: { theme: 'industrial' },
            future: { theme: 'concept' }
        },
        software: {
            development: { theme: 'code' },
            apps: { theme: 'modern' }
        },
        audio: {
            innovation: { theme: 'creative' },
            hardware: { theme: 'tech' },
            production: { theme: 'studio' }
        },
        mobile: {
            apple: { theme: 'minimal' },
            emerging: { theme: 'future' },
            android: { theme: 'tech' }
        },
        AI: {
            general: { theme: 'future' }
        }
    }
};

// Theme-specific CSS variables
const themeStyles = {
    science: {
        primary: '#2196F3',
        secondary: '#03A9F4',
        accent: '#00BCD4'
    },
    future: {
        primary: '#7C4DFF',
        secondary: '#651FFF',
        accent: '#6200EA'
    },
    green: {
        primary: '#4CAF50',
        secondary: '#43A047',
        accent: '#388E3C'
    },
    // Add more theme definitions...
};

// Generate theme-specific CSS
const generateThemeCSS = (theme) => `
/* Theme: ${theme} */
:root {
    --primary-color: ${themeStyles[theme]?.primary || '#2196F3'};
    --secondary-color: ${themeStyles[theme]?.secondary || '#1976D2'};
    --accent-color: ${themeStyles[theme]?.accent || '#0D47A1'};

    /* Light mode */
    --bg-color: #ffffff;
    --text-color: #212121;
    --card-bg: #f5f5f5;
    --border-color: #e0e0e0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-color: #121212;
        --text-color: #ffffff;
        --card-bg: #1e1e1e;
        --border-color: #333333;
    }
}

/* Section-specific styles */
.content-wrapper {
    max-width: var(--container-width, 1200px);
    margin: 0 auto;
    padding: 2rem 1rem;
    background: var(--bg-color);
    color: var(--text-color);
}

.card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--card-radius, 8px);
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Theme-specific animations */
@keyframes theme-pulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
}

.theme-element {
    animation: theme-pulse 2s infinite;
}
`;

// Generate index.html template
const generateIndexHTML = (section, subsection, subsubsection) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${section} ${subsection} ${subsubsection} - TheGossRoom">
    <title>${subsubsection} - ${subsection} ${section} | TheGossRoom</title>

    <link rel="stylesheet" href="/shared/global.css">
    <link rel="stylesheet" href="/shared/nav-tree.css">
    <link rel="stylesheet" href="styles/style.css">
</head>
<body>
    <header>
        <nav class="main-nav">
            <a href="/" class="logo">TheGossRoom</a>
            <a href="/${section.toLowerCase()}">${section}</a>
            <a href="/${section.toLowerCase()}/${subsection.toLowerCase()}">${subsection}</a>
            <span class="current">${subsubsection}</span>
            <a href="/attribution.html">Attribution</a>
        </nav>
    </header>

    <main class="content-wrapper">
        <div id="breadcrumbs"></div>
        <div id="section-nav"></div>

        <section class="trending-topics">
            <h2>Trending in ${subsubsection}</h2>
            <div id="topics-container" class="card-grid"></div>
        </section>

        <section class="latest-news">
            <h2>Latest ${subsubsection} News</h2>
            <div id="articles-grid" class="card-grid"></div>
        </section>
    </main>

    <footer>
        <p>
            <a href="/LICENSE">©</a> <span id="currentYear"></span> 
            <a href="https://tfp.la">TFP</a> | 
            <a href="https://thelaboratory.cc">The Laboratory</a> | 
            <a href="https://thelaboratory.cc/thankyou.html">Thank You</a>
        </p>
    </footer>

    <script src="/shared/global.js"></script>
    <script src="/shared/nav-tree.js"></script>
    <script src="script.js"></script>
</body>
</html>
`;

async function generateFullSiteStructure() {
    try {
        for (const [section, subsections] of Object.entries(fullSiteStructure)) {
            for (const [subsection, subsubsections] of Object.entries(subsections)) {
                for (const [subsubsection, config] of Object.entries(subsubsections)) {
                    const folderPath = path.join('dist', section, subsection, subsubsection);
                    const stylesPath = path.join(folderPath, 'styles');
                    const dataPath = path.join(folderPath, 'data');

                    // Create folder structure
                    await fs.mkdir(folderPath, { recursive: true });
                    await fs.mkdir(stylesPath, { recursive: true });
                    await fs.mkdir(dataPath, { recursive: true });

                    // Generate files
                    await fs.writeFile(
                        path.join(folderPath, 'index.html'),
                        generateIndexHTML(section, subsection, subsubsection)
                    );

                    await fs.writeFile(
                        path.join(stylesPath, 'style.css'),
                        generateThemeCSS(config.theme)
                    );

                    // Create empty data files
                    await fs.writeFile(
                        path.join(dataPath, 'topics.json'),
                        JSON.stringify({ topics: [] }, null, 2)
                    );

                    await fs.writeFile(
                        path.join(dataPath, 'feeds.json'),
                        JSON.stringify({ feeds: [] }, null, 2)
                    );
                }
            }
        }

        console.log('Full site structure generated successfully!');
    } catch (error) {
        console.error('Error generating site structure:', error);
    }
}

// Run the generator
generateFullSiteStructure();

