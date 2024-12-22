const fs = require('fs');
const path = require('path');

// File paths
const dataPath = path.join(__dirname, 'data', 'gossip_data.json');
const celebsPath = path.join(__dirname, 'celebrities.txt');

// Read files
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let celebsList = fs.existsSync(celebsPath) 
    ? fs.readFileSync(celebsPath, 'utf8').split('\n').filter(Boolean)
    : [];

// Time windows
const now = new Date();
const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
const oneWeekAgo = new Date(new Date().setDate(new Date().getDate() - 7));

// Initialize tracking
const mentionCounts = new Map();
const newNameFrequencies = new Map();
const properNameRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;

// Clean old entries
data.entries = data.entries.filter(entry => new Date(entry.published) > oneMonthAgo);
data.fallback_entries = data.fallback_entries.filter(entry => new Date(entry.published) > oneMonthAgo);

// Process recent entries for mentions
const recentEntries = [...data.entries, ...data.fallback_entries]
    .filter(entry => new Date(entry.published) > oneWeekAgo);

// Track mentions and topics
const topicMentions = new Map();
const hourlyTopics = {};
for (let i = 1; i <= 10; i++) {
    hourlyTopics[i.toString()] = [];
}

recentEntries.forEach(entry => {
    const textLower = `${entry.title} ${entry.description || ''}`.toLowerCase();
    const textOriginal = `${entry.title} ${entry.description || ''}`;
    const entryDate = new Date(entry.published);
    const hoursAgo = Math.floor((now - entryDate) / (1000 * 60 * 60));

    // Count celebrity mentions
    celebsList.forEach(celeb => {
        if (textLower.includes(celeb.toLowerCase())) {
            mentionCounts.set(celeb, (mentionCounts.get(celeb) || 0) + 1);

            // Track topic mentions for popularity
            topicMentions.set(celeb, (topicMentions.get(celeb) || 0) + 1);

            // Add to hourly topics if within last 10 hours
            if (hoursAgo <= 10) {
                const hourBucket = Math.min(Math.max(Math.ceil(hoursAgo), 1), 10);
                if (!hourlyTopics[hourBucket.toString()].includes(celeb)) {
                    hourlyTopics[hourBucket.toString()].push(celeb);
                }
            }
        }
    });

    // Track new names
    const matches = textOriginal.match(properNameRegex) || [];
    matches.forEach(name => {
        if (!celebsList.includes(name)) {
            newNameFrequencies.set(name, (newNameFrequencies.get(name) || 0) + 1);
        }
    });
});

// Add new frequently mentioned names
const newCelebs = Array.from(newNameFrequencies.entries())
    .filter(([name, count]) => count >= 3 && !celebsList.includes(name))
    .map(([name]) => name);

if (newCelebs.length > 0) {
    celebsList = [...celebsList, ...newCelebs].sort();
    fs.writeFileSync(celebsPath, celebsList.join('\n') + '\n');
}

// Categorize celebrities with mention counts
const hot_this_week = [];
const not_this_week = [];
const upcoming_new_names = [];

celebsList.forEach(celeb => {
    const mentions = mentionCounts.get(celeb) || 0;
    if (mentions >= 5) {
        hot_this_week.push([celeb, mentions]);
    } else if (mentions >= 2) {
        upcoming_new_names.push([celeb, mentions]);
    } else {
        not_this_week.push([celeb, mentions]);
    }
});

// Sort categories by mention count
hot_this_week.sort((a, b) => b[1] - a[1]);
upcoming_new_names.sort((a, b) => b[1] - a[1]);
not_this_week.sort((a, b) => b[1] - a[1]);

// Weekly popularity chart (top 20 most mentioned)
const weekly_popularity = Array.from(topicMentions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

// Update data object with new categorizations
data.hot_this_week = hot_this_week;
data.not_this_week = not_this_week;
data.upcoming_new_names = upcoming_new_names;
data.weekly_popularity = weekly_popularity;
data.hourly_topics = hourlyTopics;

// Save updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

// Log results
console.log('Cleanup completed:');
console.log(`- Hot celebrities: ${hot_this_week.length}`);
console.log(`- Upcoming celebrities: ${upcoming_new_names.length}`);
console.log(`- Not trending: ${not_this_week.length}`);
console.log(`- New celebrities added: ${newCelebs.length}`);
