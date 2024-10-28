// site-generator.js
const fs = require('fs').promises;
const path = require('path');

const siteStructure = {
    tech: {
        AI: {
            rss: [
                'https://www.artificialintelligence-news.com/feed/',
                'https://www.unite.ai/feed/',
                'https://www.marktechpost.com/feed/',
                'https://machinelearningmastery.com/feed/',
                'https://www.datanami.com/feed/'
            ],
            topics: [
                'Machine Learning',
                'Neural Networks',
                'Robotics',
                'Natural Language Processing',
                'Computer Vision'
            ]
        },
        mobile: {
            rss: [
                'https://www.gsmarena.com/rss-news-reviews.php3',
                'https://www.androidauthority.com/feed',
                'https://www.phonearena.com/feed',
                'https://www.androidpolice.com/feed',
                'https://www.imore.com/feed'
            ],
            topics: [
                '5G Networks',
                'Smartphone Reviews',
                'Mobile Gaming',
                'App Development',
                'Wearable Tech'
            ]
        },
        automotive: {
            rss: [
                'https://www.motortrend.com/feed',
                'https://www.caranddriver.com/rss/all.xml/',
                'https://www.autoblog.com/rss.xml',
                'https://www.autoweek.com/feed',
                'https://electrek.co/feed'
            ],
            topics: [
                'Electric Vehicles',
                'Self-Driving Technology',
                'Connected Cars',
                'Vehicle Safety',
                'Green Transportation'
            ]
        }
    },
    celebrity: {
        movies: {
            rss: [
                'https://variety.com/feed/',
                'https://deadline.com/feed/',
                'https://www.hollywoodreporter.com/feed/',
                'https://www.indiewire.com/feed/',
                'https://screenrant.com/feed/'
            ],
            topics: [
                'Box Office',
                'Movie Reviews',
                'Hollywood News',
                'Indie Films',
                'Awards Season'
            ]
        },
        music: {
            rss: [
                'https://www.billboard.com/feed/',
                'https://pitchfork.com/feed/',
                'https://www.nme.com/feed',
                'https://consequence.net/feed/',
                'https://www.rollingstone.com/feed/'
            ],
            topics: [
                'New Releases',
                'Concert News',
                'Artist Updates',
                'Industry News',
                'Music Reviews'
            ]
        }
    },
    climate: {
        science: {
            rss: [
                'https://climate.nasa.gov/feed/',
                'https://www.carbonbrief.org/feed',
                'https://www.climatechangenews.com/feed/',
                'https://www.nature.com/nature/climate-change.rss',
                'https://news.science.org/feed/'
            ],
            topics: [
                'Climate Research',
                'Weather Patterns',
                'Ocean Studies',
                'Atmospheric Science',
                'Data Analysis'
            ]
        },
        solutions: {
            rss: [
                'https://cleantechnica.com/feed/',
                'https://www.greentechmedia.com/feed',
                'https://www.ecowatch.com/feed/',
                'https://www.renewableenergyworld.com/feed/',
                'https://www.treehugger.com/feed'
            ],
            topics: [
                'Renewable Energy',
                'Green Technology',
                'Sustainability',
                'Conservation',
                'Climate Action'
            ]
        }
    }
};

const templateHTML = (section, subsection) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Latest ${subsection} news and developments - TheGossRoom ${section}">
    <title>${subsection} News & Updates | TheGossRoom ${section}</title>

    <link rel="stylesheet" href="/shared/global.css">
    <link rel="stylesheet" href="/shared/styles/nav-tree.css">
    <link rel="stylesheet" href="styles/style.css">
</head>
<body>
    <header>
        <nav class="main-nav">
            <a href="/" class="logo">TheGossRoom</a>
            <a href="/${section.toLowerCase()}">${section}</a>
            <span class="current">${subsection}</span>
            <a href="/attribution.html">Attribution</a>
        </nav>
    </header>

    <main class="content-wrapper">
        <div id="breadcrumbs"></div>
        <div id="section-nav"></div>

        <section class="trending-topics">
            <h2>Trending in ${subsection}</h2>
            <div id="topics-container"></div>
        </section>

        <section class="latest-news">
            <h2>Latest ${subsection} News</h2>
            <div id="articles-grid"></div>
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
    <script src="/shared/components/nav-tree.js"></script>
    <script src="script.js"></script>
</body>
</html>
`;

const defaultStyle = `
/* Section-specific styles */
:root {
    --section-accent: var(--primary-color);
    --section-gradient: linear-gradient(135deg, var(--section-accent), var(--secondary-color));
}

/* Layout and Grid */
.content-wrapper {
    max-width: var(--container-width);
    margin: 0 auto;
    padding: 2rem 1rem;
}

/* Add more section-specific styles here */
`;

const defaultScript = `
// Section-specific JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    const navTree = new NavTree();
    document.getElementById('breadcrumbs').innerHTML = navTree.generateBreadcrumbs();
    document.getElementById('section-nav').innerHTML = navTree.generateSectionNav();

    // Load and display RSS feeds
    const feeds = await fetch('rss.txt').then(r => r.text());
    const topics = await fetch('topics.txt').then(r => r.text());

    // Initialize content
    initializeContent(feeds.split('\\n'), topics.split('\\n'));
});
`;

async function generateSiteStructure() {
    try {
        // Create base directories
        await fs.mkdir('dist', { recursive: true });
        await fs.mkdir('dist/shared', { recursive: true });
        await fs.mkdir('dist/shared/styles', { recursive: true });
        await fs.mkdir('dist/shared/components', { recursive: true });

        // Generate section directories and files
        for (const [section, subsections] of Object.entries(siteStructure)) {
            const sectionPath = path.join('dist', section.toLowerCase());
            await fs.mkdir(sectionPath, { recursive: true });

            // Generate section index
            await fs.writeFile(
                path.join(sectionPath, 'index.html'),
                templateHTML(section, section)
            );

            // Generate subsections
            for (const [subsection, content] of Object.entries(subsections)) {
                const subsectionPath = path.join(sectionPath, subsection);
                await fs.mkdir(subsectionPath, { recursive: true });
                await fs.mkdir(path.join(subsectionPath, 'styles'), { recursive: true });

                // Create subsection files
                await fs.writeFile(
                    path.join(subsectionPath, 'index.html'),
                    templateHTML(section, subsection)
                );
                await fs.writeFile(
                    path.join(subsectionPath, 'styles', 'style.css'),
                    defaultStyle
                );
                await fs.writeFile(
                    path.join(subsectionPath, 'script.js'),
                    defaultScript
                );
                await fs.writeFile(
                    path.join(subsectionPath, 'rss.txt'),
                    content.rss.join('\n')
                );
                await fs.writeFile(
                    path.join(subsectionPath, 'topics.txt'),
                    content.topics.join('\n')
                );
            }
        }

        console.log('Site structure generated successfully!');
    } catch (error) {
        console.error('Error generating site structure:', error);
    }
}

// Run the generator
generateSiteStructure();

