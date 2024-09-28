document.addEventListener('DOMContentLoaded', function() {
    fetchGossipData();
});

async function fetchGossipData() {
    try {
        const response = await fetch('data/gossip_data.json');
        const data = await response.json();
        displayEntries(data.entries, data.fallback_entries);
        displayLastHourTopics(data.hourly_topics['1']);
        displayHourlyTopics(data.hourly_topics);
        displayWeeklyPopularity(data.weekly_popularity);
        displayCelebrityCategories(data.hot_this_week, data.not_this_week, data.upcoming_new_names);
    } catch (error) {
        console.error('Error fetching gossip data:', error);
    }
}

function displayEntries(entries, fallbackEntries) {
    const container = document.getElementById('gossip-entries');
    container.innerHTML = '';
    if (entries.length > 0) {
        entries.forEach(entry => {
            const entryElement = createEntryElement(entry);
            container.appendChild(entryElement);
        });
    } else if (fallbackEntries.length > 0) {
        const fallbackMessage = document.createElement('p');
        fallbackMessage.textContent = "No new gossip today, but here are some popular recent stories:";
        fallbackMessage.className = 'fallback-message';
        container.appendChild(fallbackMessage);
        fallbackEntries.forEach(entry => {
            const entryElement = createEntryElement(entry);
            entryElement.classList.add('fallback-entry');
            container.appendChild(entryElement);
        });
    } else {
        container.innerHTML = '<p>No gossip data available at the moment. Check back later!</p>';
    }
}

function createEntryElement(entry) {
    const entryElement = document.createElement('div');
    entryElement.className = 'gossip-entry';
    if (entry.image) {
        const imageElement = document.createElement('img');
        imageElement.src = entry.image;
        imageElement.alt = entry.title;
        entryElement.appendChild(imageElement);
    }
    const titleElement = document.createElement('h3');
    const linkElement = document.createElement('a');
    linkElement.href = entry.link;
    linkElement.textContent = entry.title;
    linkElement.target = '_blank';
    titleElement.appendChild(linkElement);
    const dateElement = document.createElement('p');
    dateElement.textContent = new Date(entry.published).toLocaleString();
    const topicsElement = document.createElement('p');
    topicsElement.textContent = 'Topics: ' + entry.topics.join(', ');
    entryElement.appendChild(titleElement);
    entryElement.appendChild(dateElement);
    entryElement.appendChild(topicsElement);
    return entryElement;
}

function displayLastHourTopics(topics) {
    const container = document.getElementById('last-hour-topics');
    container.innerHTML = '<h3>Trending in the Last Hour</h3>';
    if (topics && topics.length > 0) {
        container.innerHTML += `<p>${topics.join(', ')}</p>`;
    } else {
        container.innerHTML += '<p>No trending topics in the last hour.</p>';
    }
}

function displayHourlyTopics(hourlyTopics) {
    const container = document.getElementById('hourly-topics');
    container.innerHTML = '<h2>Trending in the Last 10 Hours</h2>';
    const list = document.createElement('ul');
    for (let i = 2; i <= 10; i++) {
        const topics = hourlyTopics[i.toString()];
        if (topics && topics.length > 0) {
            const item = document.createElement('li');
            item.textContent = `${i} hours ago: ${topics.join(', ')}`;
            list.appendChild(item);
        }
    }
    container.appendChild(list);
}

function displayWeeklyPopularity(weeklyPopularity) {
    const container = document.getElementById('popularity-chart');
    container.innerHTML = '';
    const list = document.createElement('ol');
    weeklyPopularity.forEach(([topic, count]) => {
        const item = document.createElement('li');
        item.textContent = `${topic}: ${count} mentions`;
        list.appendChild(item);
    });
    container.appendChild(list);
}

function displayCelebrityCategories(hotThisWeek, notThisWeek, upcomingNewNames) {
    displayCategoryList('hot-this-week', hotThisWeek);
    displayCategoryList('not-this-week', notThisWeek);
    displayCategoryList('upcoming-new-names', upcomingNewNames);
}

function displayCategoryList(elementId, items) {
    const list = document.querySelector(`#${elementId} ul`);
    list.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        if (Array.isArray(item)) {
            li.textContent = `${item[0]}: ${item[1]} mentions`;
        } else {
            li.textContent = item;
        }
        list.appendChild(li);
    });
}

// Pagination setup (if needed)
let currentPage = 1;
const entriesPerPage = 10;

document.getElementById('load-more').addEventListener('click', function() {
    currentPage++;
    fetchGossipData();
});
