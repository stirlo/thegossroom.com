document.addEventListener('DOMContentLoaded', function() {
    fetch('data/gossip_data.json')
        .then(response => response.json())
        .then(data => {
            const contentDiv = document.getElementById('content');
            for (const [topic, articles] of Object.entries(data)) {
                const topicSection = document.createElement('section');
                topicSection.className = 'topic-section';
                topicSection.innerHTML = `
                    <h2>${topic} News</h2>
                    ${articles.map(article => `
                        <article class="article">
                            <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
                            <p>Published: ${new Date(article.published).toLocaleString()}</p>
                            <p>${article.summary}</p>
                        </article>
                    `).slice(0, 5).join('')}
                `;
                contentDiv.appendChild(topicSection);
            }
        })
        .catch(error => {
            console.error('Error fetching gossip data:', error);
            document.getElementById('content').innerHTML = '<p>Sorry, there was an error loading the latest gossip. Please try again later.</p>';
        });
});
