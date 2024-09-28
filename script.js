document.addEventListener('DOMContentLoaded', function() {
    fetch('data/gossip_data.json')
        .then(response => response.json())
        .then(data => {
            displayEntries(data.entries, data.fallback_entries);
            displayHourlyTopics(data.hourly_topics);
            displayWeeklyPopularity(data.weekly_popularity);
            displayLastHourTopics(data.hourly_topics['1']);
        })
        .catch(error => console.error('Error:', error));
});

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

function displayHourlyTopics(hourlyTopics) {
    const container = document.getElementById('hourly-topics');
    container.innerHTML = '<h2>Trending in the Last 10 Hours</h2>';

    const list = document.createElement('ul');
    for (let i = 1; i <= 10; i++) {
        const topics = hourlyTopics[i.toString()];
        if (topics && topics.length > 0) {
            const item = document.createElement('li');
            item.textContent = `${i} hour${i > 1 ? 's' : ''} ago: ${topics.join(', ')}`;
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

function displayLastHourTopics(lastHourTopics) {
    const container = document.getElementById('last-hour-topics');
    container.innerHTML = '<h3>Trending in the Last Hour</h3>';

    if (lastHourTopics && lastHourTopics.length > 0) {
        const topicsList = lastHourTopics.join(', ');
        container.innerHTML += `<p>${topicsList}</p>`;
    } else {
        container.innerHTML += '<p>No trending topics in the last hour.</p>';
    }
}
