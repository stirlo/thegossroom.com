// asset-builder.js
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp'); // For image processing
const sass = require('sass'); // For SCSS compilation
const terser = require('terser'); // For JS minification

const DIST_DIR = 'dist';
const SHARED_DIR = path.join(DIST_DIR, 'shared');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

// Shared JavaScript content
const sharedJavaScript = {
    'global.js': `
// Global JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Dark mode toggle
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const toggleDarkMode = (e) => {
        document.body.classList.toggle('dark-mode', e.matches);
    };
    prefersDark.addListener(toggleDarkMode);
    toggleDarkMode(prefersDark);

    // Initialize lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('loading' in HTMLImageElement.prototype) {
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const lazyLoadScript = document.createElement('script');
        lazyLoadScript.src = '/shared/lazy-load-polyfill.js';
        document.body.appendChild(lazyLoadScript);
    }

    // Initialize infinite scroll
    initInfiniteScroll();
});

function initInfiniteScroll() {
    const articleGrid = document.getElementById('articles-grid');
    if (!articleGrid) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMoreArticles();
                }
            });
        },
        { rootMargin: '100px' }
    );

    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    articleGrid.appendChild(sentinel);
    observer.observe(sentinel);
}

async function loadMoreArticles() {
    // Implementation for loading more articles
    // This will be customized per section
}
    `,

    'nav-tree.js': `
// Navigation tree functionality
class NavTree {
    constructor() {
        this.init();
    }

    init() {
        this.buildBreadcrumbs();
        this.buildSectionNav();
    }

    buildBreadcrumbs() {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (!breadcrumbs) return;

        const path = window.location.pathname.split('/').filter(Boolean);
        let html = '<a href="/">Home</a>';
        let currentPath = '';

        path.forEach((item, index) => {
            currentPath += '/' + item;
            const isLast = index === path.length - 1;
            html += ' > ';
            if (isLast) {
                html += '<span class="current">' + this.formatName(item) + '</span>';
            } else {
                html += '<a href="' + currentPath + '">' + this.formatName(item) + '</a>';
            }
        });

        breadcrumbs.innerHTML = html;
    }

    buildSectionNav() {
        const sectionNav = document.getElementById('section-nav');
        if (!sectionNav) return;

        // Build section navigation based on current path
        // Implementation will vary based on section
    }

    formatName(str) {
        return str.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

new NavTree();
    `,

    'lazy-load-polyfill.js': `
// Lazy loading polyfill for older browsers
if (!('loading' in HTMLImageElement.prototype)) {
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('loading');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    });
}
    `
};

// Shared CSS content
const sharedCSS = {
    'global.scss': `
// Variables
:root {
    --max-width: 1200px;
    --border-radius: 8px;
    --font-mono: ui-monospace, Menlo, Monaco, 'Cascadia Mono', 'Segoe UI Mono',
        'Roboto Mono', 'Oxygen Mono', 'Ubuntu Monospace', 'Source Code Pro',
        'Fira Mono', 'Droid Sans Mono', 'Courier New', monospace;

    // Light mode
    --foreground-rgb: 0, 0, 0;
    --background-start-rgb: 214, 219, 220;
    --background-end-rgb: 255, 255, 255;

    // Dark mode colors will be handled by CSS
}

// Global styles
* {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
}

html,
body {
    max-width: 100vw;
    overflow-x: hidden;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
        Roboto, 'Helvetica Neue', Arial, sans-serif;
}

a {
    color: inherit;
    text-decoration: none;
}

// Dark mode styles
@media (prefers-color-scheme: dark) {
    html {
        color-scheme: dark;
    }
}

// Layout
.container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 1rem;
}

// Grid system
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

// Card styles
.card {
    border-radius: var(--border-radius);
    padding: 1rem;
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-2px);
    }
}

// Utility classes
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}
    `,

    'nav-tree.scss': `
// Navigation styles
.nav-tree {
    margin: 1rem 0;

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        margin: 0.5rem 0;
    }

    a {
        display: block;
        padding: 0.5rem;
        border-radius: var(--border-radius);
        transition: background-color 0.2s ease;

        &:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
    }
}

// Breadcrumbs
.breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 1rem 0;

    a {
        color: var(--primary-color);

        &:hover {
            text-decoration: underline;
        }
    }

    .current {
        font-weight: bold;
    }
}
    `
};

async function buildAssets() {
    try {
        console.log('🏗️ Starting asset build process...');

        // Create necessary directories
        await fs.mkdir(SHARED_DIR, { recursive: true });
        await fs.mkdir(ASSETS_DIR, { recursive: true });
        await fs.mkdir(path.join(ASSETS_DIR, 'images'), { recursive: true });

        // Build JavaScript files
        console.log('📦 Building JavaScript files...');
        for (const [filename, content] of Object.entries(sharedJavaScript)) {
            const minified = await terser.minify(content);
            await fs.writeFile(
                path.join(SHARED_DIR, filename),
                minified.code
            );
        }

        // Build CSS files
        console.log('🎨 Building CSS files...');
        for (const [filename, content] of Object.entries(sharedCSS)) {
            const result = sass.renderSync({
                data: content,
                outputStyle: 'compressed'
            });
            await fs.writeFile(
                path.join(SHARED_DIR, filename.replace('.scss', '.css')),
                result.css
            );
        }

        // Process images (if any exist in the source directory)
        console.log('🖼️ Processing images...');
        const sourceImagesDir = path.join('src', 'assets', 'images');
        try {
            const images = await fs.readdir(sourceImagesDir);
            for (const image of images) {
                if (image.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    await sharp(path.join(sourceImagesDir, image))
                        .resize(800, 800, {
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                        .jpeg({ quality: 80 })
                        .toFile(path.join(ASSETS_DIR, 'images', image));
                }
            }
        } catch (error) {
            console.log('No source images found, skipping image processing');
        }

        // Create favicon variants
        console.log('🎯 Generating favicons...');
        try {
            const favicon = await fs.readFile(path.join('src', 'favicon.png'));
            const sizes = [16, 32, 48, 96, 144, 192];

            for (const size of sizes) {
                await sharp(favicon)
                    .resize(size, size)
                    .toFile(path.join(DIST_DIR, `favicon-${size}x${size}.png`));
            }
        } catch (error) {
            console.log('No favicon source found, skipping favicon generation');
        }

        console.log('✅ Asset build completed successfully!');
    } catch (error) {
        console.error('❌ Error building assets:', error);
        throw error;
    }
}

// Run the builder
buildAssets().catch(console.error);

module.exports = {
    buildAssets
};

