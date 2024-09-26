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
            const topicsDiv = document.getElementById('last-hour-topics');

            // Check if data is an array (old format) or an object with 'entries' (new format)
            const entries = Array.isArray(data) ? data : (data.entries || []);
            const lastHourTopics = data.last_hour_topics || [];

            if (entries.length === 0) {
                contentDiv.innerHTML = '<p>No gossip data available at the moment. Check back later!</p>';
                return;
            }

            // Create HTML for all articles
            const articlesHTML = entries.map(item => `
                <article class="article">
                    <h2>${Array.isArray(item.topics) ? item.topics.join(', ') : (item.topic || 'Gossip')}</h2>
                    <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                    <p>Published: ${new Date(item.published).toLocaleString()}</p>
                    <p>${item.summary}</p>
                </article>
            `).join('');

            // Add the populated content to the content div
            contentDiv.innerHTML = articlesHTML;

            // Create HTML for last hour's topics
            const topicsHTML = lastHourTopics.map((topic, index) => `
                <a href="#" class="topic-link" data-topic="${topic}">${index + 1}</a>
            `).join(' ');

            topicsDiv.innerHTML = lastHourTopics.length > 0 ? 
                `<h3>Last Hour's Topics:</h3>${topicsHTML}` : 
                '<p>No hot topics in the last hour.</p>';

            // Add event listeners to topic links
            document.querySelectorAll('.topic-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const topic = this.getAttribute('data-topic');
                    const topicArticles = entries.filter(item => 
                        (Array.isArray(item.topics) && item.topics.includes(topic)) || 
                        item.topic === topic
                    );

                    const topicHTML = topicArticles.map(item => `
                        <article class="article">
                            <h2>${topic}</h2>
                            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                            <p>Published: ${new Date(item.published).toLocaleString()}</p>
                            <p>${item.summary}</p>
                        </article>
                    `).join('');

                    contentDiv.innerHTML = topicHTML || '<p>No articles found for this topic.</p>';
                });
            });
        })
        .catch(error => {
            console.error('Error fetching gossip data:', error);
            document.getElementById('content').innerHTML = `
                <p>Sorry, there was an error loading the latest gossip. Please try again later.</p>
                <p>Error details: ${error.message}</p>
            `;
        });
});
