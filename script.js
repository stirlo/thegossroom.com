// script.js

document.addEventListener('DOMContentLoaded', initializePage);

function initializePage() {
    loadLatestGossip();
    updateHourlyTopics();
    updatePopularityChart();
    setupLoadMoreButton();
    updateCelebrityCategories();
    setupPeriodicUpdates();
}

function loadLatestGossip(page = 1) {
    fetch(`data/gossip_data.json`)
        .then(response => response.json())
        .then(data => {
            const gossipEntriesContainer = document.getElementById('gossip-entries');
            gossipEntriesContainer.innerHTML = ''; // Clear existing entries
            data.entries.slice((page - 1) * 10, page * 10).forEach(entry => {
                gossipEntriesContainer.appendChild(createGossipEntryElement(entry));
            });
            updateLoadMoreButton(data.entries.length > page * 10);
        });
}

function createGossipEntryElement(entry) {
    const article = document.createElement('article');
    article.innerHTML = `
        <h3><a href="${entry.link}" target="_blank">${entry.title}</a></h3>
        <p>${entry.summary}</p>
        <p class="topics">Topics: ${entry.topics.join(', ')}</p>
        <p class="published">Published: ${entry.published}</p>
    `;
    return article;
}

function updateHourlyTopics() {
    fetch('data/gossip_data.json')
        .then(response => response.json())
        .then(data => {
            const hourlyTopicsContainer = document.getElementById('hourly-topics');
            hourlyTopicsContainer.innerHTML = ''; // Clear existing content
            for (const [hour, topics] of Object.entries(data.hourly_topics)) {
                const hourBlock = document.createElement('div');
                hourBlock.className = 'hour-block';
                hourBlock.innerHTML = `
                    <h3>${hour} hour${hour !== '1' ? 's' : ''} ago</h3>
                    <ul>
                        ${topics.map(topic => `<li>${topic}</li>`).join('')}
                    </ul>
                `;
                hourlyTopicsContainer.appendChild(hourBlock);
            }
        });
}

function updatePopularityChart() {
    fetch('data/gossip_data.json')
        .then(response => response.json())
        .then(data => {
            const chartContainer = document.getElementById('popularity-chart');
            chartContainer.innerHTML = ''; // Clear existing content
            const topCelebrities = data.weekly_popularity.slice(0, 10);
            topCelebrities.forEach(([celebrity, count]) => {
                const bar = document.createElement('div');
                bar.className = 'popularity-bar';
                bar.style.width = `${count / topCelebrities[0][1] * 100}%`;
                bar.innerHTML = `<span>${celebrity}: ${count}</span>`;
                chartContainer.appendChild(bar);
            });
        });
}

function setupLoadMoreButton() {
    const loadMoreButton = document.getElementById('load-more');
    let currentPage = 1;
    loadMoreButton.addEventListener('click', () => {
        currentPage++;
        loadLatestGossip(currentPage);
    });
}

function updateLoadMoreButton(hasMore) {
    const loadMoreButton = document.getElementById('load-more');
    loadMoreButton.style.display = hasMore ? 'block' : 'none';
}

function updateCelebrityCategories() {
    fetch('data/gossip_data.json')
        .then(response => response.json())
        .then(data => {
            updateCategoryList('hot-this-week', data.hot_this_week);
            updateCategoryList('not-this-week', data.not_this_week);
            updateCategoryList('upcoming-new-names', data.upcoming_new_names);
        });
}

function updateCategoryList(id, data) {
    const list = document.querySelector(`#${id} ul`);
    list.innerHTML = ''; // Clear existing content
    data.forEach(([celebrity, count]) => {
        const li = document.createElement('li');
        li.textContent = `${celebrity}${count ? ': ' + count : ''}`;
        list.appendChild(li);
    });
}

function setupPeriodicUpdates() {
    setInterval(() => {
        updateHourlyTopics();
        updatePopularityChart();
        updateCelebrityCategories();
    }, 300000); // Update every 5 minutes
}
