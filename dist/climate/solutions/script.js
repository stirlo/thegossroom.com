
// Section-specific JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    const navTree = new NavTree();
    document.getElementById('breadcrumbs').innerHTML = navTree.generateBreadcrumbs();
    document.getElementById('section-nav').innerHTML = navTree.generateSectionNav();

    // Load and display RSS feeds
    const feeds = await fetch('rss.txt').then(r => r.text());
    const topics = await fetch('topics.txt').then(r => r.text());

    // Initialize content
    initializeContent(feeds.split('\n'), topics.split('\n'));
});
