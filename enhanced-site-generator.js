// enhanced-site-generator.js
const fs = require('fs').promises;
const path = require('path');

// Complete theme system
const themeStyles = {
    science: {
        primary: '#2196F3',
        secondary: '#03A9F4',
        accent: '#00BCD4',
        gradient: 'linear-gradient(135deg, #2196F3, #00BCD4)',
        cardBg: 'rgba(33, 150, 243, 0.1)'
    },
    future: {
        primary: '#7C4DFF',
        secondary: '#651FFF',
        accent: '#6200EA',
        gradient: 'linear-gradient(135deg, #7C4DFF, #6200EA)',
        cardBg: 'rgba(124, 77, 255, 0.1)'
    },
    green: {
        primary: '#4CAF50',
        secondary: '#43A047',
        accent: '#388E3C',
        gradient: 'linear-gradient(135deg, #4CAF50, #388E3C)',
        cardBg: 'rgba(76, 175, 80, 0.1)'
    },
    tech: {
        primary: '#0288D1',
        secondary: '#0277BD',
        accent: '#01579B',
        gradient: 'linear-gradient(135deg, #0288D1, #01579B)',
        cardBg: 'rgba(2, 136, 209, 0.1)'
    },
    space: {
        primary: '#311B92',
        secondary: '#4527A0',
        accent: '#673AB7',
        gradient: 'linear-gradient(135deg, #311B92, #673AB7)',
        cardBg: 'rgba(49, 27, 146, 0.1)'
    },
    nature: {
        primary: '#2E7D32',
        secondary: '#388E3C',
        accent: '#43A047',
        gradient: 'linear-gradient(135deg, #2E7D32, #43A047)',
        cardBg: 'rgba(46, 125, 50, 0.1)'
    },
    water: {
        primary: '#0277BD',
        secondary: '#0288D1',
        accent: '#039BE5',
        gradient: 'linear-gradient(135deg, #0277BD, #039BE5)',
        cardBg: 'rgba(2, 119, 189, 0.1)'
    },
    earth: {
        primary: '#5D4037',
        secondary: '#6D4C41',
        accent: '#795548',
        gradient: 'linear-gradient(135deg, #5D4037, #795548)',
        cardBg: 'rgba(93, 64, 55, 0.1)'
    },
    code: {
        primary: '#212121',
        secondary: '#424242',
        accent: '#616161',
        gradient: 'linear-gradient(135deg, #212121, #616161)',
        cardBg: 'rgba(33, 33, 33, 0.1)'
    },
    creative: {
        primary: '#D81B60',
        secondary: '#C2185B',
        accent: '#AD1457',
        gradient: 'linear-gradient(135deg, #D81B60, #AD1457)',
        cardBg: 'rgba(216, 27, 96, 0.1)'
    },
    minimal: {
        primary: '#757575',
        secondary: '#616161',
        accent: '#424242',
        gradient: 'linear-gradient(135deg, #757575, #424242)',
        cardBg: 'rgba(117, 117, 117, 0.1)'
    },
    alert: {
        primary: '#F44336',
        secondary: '#E53935',
        accent: '#D32F2F',
        gradient: 'linear-gradient(135deg, #F44336, #D32F2F)',
        cardBg: 'rgba(244, 67, 54, 0.1)'
    },
    geo: {
        primary: '#FF5722',
        secondary: '#F4511E',
        accent: '#E64A19',
        gradient: 'linear-gradient(135deg, #FF5722, #E64A19)',
        cardBg: 'rgba(255, 87, 34, 0.1)'
    },
    forecast: {
        primary: '#00ACC1',
        secondary: '#0097A7',
        accent: '#00838F',
        gradient: 'linear-gradient(135deg, #00ACC1, #00838F)',
        cardBg: 'rgba(0, 172, 193, 0.1)'
    }
};

// Complete site structure definition
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

// Generate theme-specific CSS
const generateThemeCSS = (theme) => {
    const themeConfig = themeStyles[theme] || themeStyles.minimal;
    return `
/* Theme: ${theme} */
:root {
    --primary-color: ${themeConfig.primary};
    --secondary-color: ${themeConfig.secondary};
    --accent-color: ${themeConfig.accent};
    --theme-gradient: ${themeConfig.gradient};
    --card-bg: ${themeConfig.cardBg};

    /* Light mode */
    --bg-color: #ffffff;
    --text-color: #212121;
    --border-color: #e0e0e0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-color: #121212;
        --text-color: #ffffff;
        --border-color: #333333;
        --card-bg: rgba(255, 255, 255, 0.05);
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

.section-header {
    background: var(--theme-gradient);
    color: white;
    padding: 2rem;
    margin-bottom: 2rem;
    border-radius: var(--card-radius, 8px);
}

.topic-tag {
    background: var(--card-bg);
    color: var(--primary-color);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    display: inline-block;
    margin: 0.25rem;
    transition: all 0.3s ease;
}

.topic-tag:hover {
    background: var(--primary-color);
    color: white;
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
};

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
        <div class="section-header">
            <h1>${subsubsection}</h1>
            <p>Latest updates and news in ${section} ${subsection} ${subsubsection}</p>
        </div>

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

