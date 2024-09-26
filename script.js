document.addEventListener('DOMContentLoaded', function() {
    fetch('data/gossip_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const contentDiv = document.getElementById('content');
            if (Object.keys(data).length === 0) {
                contentDiv.innerHTML = '<p>No gossip data available at the moment. Check back later!</p>';
                return;
            }

            // Create an array to hold all articles
            let allArticles = [];

            // Iterate over each topic and its articles
            for (const [topic, articles] of Object.entries(data)) {
                articles.forEach(article => {
                    allArticles.push({
                        topic: topic,
                        article: article
                    });
                });
            }

            // Sort all articles by date, newest first
            allArticles.sort((a, b) => new Date(b.article.published) - new Date(a.article.published));

            // Create HTML for all articles
            const articlesHTML = allArticles.map(item => `
                <article class="article">
                    <h2>${item.topic}</h2>
                    <h3><a href="${item.article.link}" target="_blank">${item.article.title}</a></h3>
                    <p>Published: ${new Date(item.article.published).toLocaleString()}</p>
                    <p>${item.article.summary}</p>
                </article>
            `).join('');

            // Add the populated content to the content div
            contentDiv.innerHTML = articlesHTML;
        })
        .catch(error => {
            console.error('Error fetching gossip data:', error);
            document.getElementById('content').innerHTML = `
                <p>Sorry, there was an error loading the latest gossip. Please try again later.</p>
                <p>Error details: ${error.message}</p>
            `;
        });
});
