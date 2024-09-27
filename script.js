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
            const popularityChartDiv = document.getElementById('popularity-chart');

            // Check if data is an array (old format) or an object with 'entries' (new format)
            const entries = Array.isArray(data) ? data : (data.entries || []);
            const hourlyTopics = data.hourly_topics || {};
            const weeklyPopularity = data.weekly_popularity || [];

            if (entries.length === 0) {
                contentDiv.innerHTML = '<p>No gossip data available at the moment. Check back later!</p>';
                return;
            }

            displayGossipEntries(entries, contentDiv);
            displayLastHourTopics(hourlyTopics, topicsDiv);
            displayPopularityChart(weeklyPopularity, popularityChartDiv);

            // Add event listeners to topic links
            document.querySelectorAll('.topic-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const topic = this.getAttribute('data-topic');
                    displayTopicArticles(entries, topic, contentDiv);
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

function displayGossipEntries(entries, contentDiv) {
    const articlesHTML = entries.map(item => `
        <article class="article">
            <h2>${Array.isArray(item.topics) ? item.topics.join(', ') : (item.topic || 'Gossip')}</h2>
            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
            <p>Published: ${formatDate(item.published)}</p>
            <p>${item.summary}</p>
        </article>
    `).join('');

    contentDiv.innerHTML = articlesHTML;
}

function displayLastHourTopics(hourlyTopics, topicsDiv) {
    const latestHour = Object.keys(hourlyTopics)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .find(hour => hourlyTopics[hour].length > 0);

    if (latestHour) {
        const topicsHTML = hourlyTopics[latestHour].map((topic, index) => `
            <a href="#" class="topic-link" data-topic="${topic}">${index + 1}</a>
        `).join(' ');

        topicsDiv.innerHTML = `
            <h3>Hot Topics in the Last ${latestHour} Hour${latestHour === '1' ? '' : 's'}:</h3>
            ${topicsHTML}
        `;
    } else {
        topicsDiv.innerHTML = '<p>No hot topics in the last 10 hours</p>';
    }
}

function displayPopularityChart(weeklyPopularity, popularityChartDiv) {
    if (weeklyPopularity.length === 0) {
        popularityChartDiv.innerHTML = '<p>No popularity data available for this week.</p>';
        return;
    }

    popularityChartDiv.innerHTML = `
        <h3>Who's Popular This Week?</h3>
        ${weeklyPopularity.map(([topic, count], index) => `
            <div class="popularity-item">
                <span class="rank">#${index + 1}</span>
                <span class="topic">${topic}</span>
                <span class="count">${count} mention${count !== 1 ? 's' : ''}</span>
            </div>
        `).join('')}
    `;
}

function displayTopicArticles(entries, topic, contentDiv) {
    const topicArticles = entries.filter(item => 
        (Array.isArray(item.topics) && item.topics.includes(topic)) || 
        item.topic === topic
    );

    const topicHTML = topicArticles.map(item => `
        <article class="article">
            <h2>${topic}</h2>
            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
            <p>Published: ${formatDate(item.published)}</p>
            <p>${item.summary}</p>
        </article>
    `).join('');

    contentDiv.innerHTML = topicHTML || '<p>No articles found for this topic.</p>';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}
