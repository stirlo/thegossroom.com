const fs = require('fs');
const path = require('path');

// File paths
const dataPath = path.join(__dirname, 'data', 'gossip_data.json');
const celebsPath = path.join(__dirname, 'celebrities.txt');
const debugLogPath = path.join(__dirname, 'cleanup-debug.log');

// Initialize debug logging
const debugLog = [];

function logDebug(message) {
    debugLog.push(`${new Date().toISOString()}: ${message}`);
    console.log(message);
}

try {
    // Read and parse data
    logDebug('Reading data files...');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    let celebsList = fs.existsSync(celebsPath) 
        ? fs.readFileSync(celebsPath, 'utf8').split('\n').filter(Boolean)
        : [];

    // Time windows
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    logDebug(`Filtering entries older than ${oneMonthAgo.toISOString()}`);

    // Clean old entries with strict date filtering
    const originalEntriesCount = data.entries.length;
    const originalFallbackCount = data.fallback_entries.length;

    data.entries = data.entries.filter(entry => {
        const entryDate = new Date(entry.published);
        return entryDate > oneMonthAgo;
    });

    data.fallback_entries = data.fallback_entries.filter(entry => {
        const entryDate = new Date(entry.published);
        return entryDate > oneMonthAgo;
    });

    logDebug(`Removed ${originalEntriesCount - data.entries.length} main entries`);
    logDebug(`Removed ${originalFallbackCount - data.fallback_entries.length} fallback entries`);

    // Process mentions for remaining entries
    const mentionCounts = new Map();
    const recentEntries = [...data.entries, ...data.fallback_entries];

    logDebug(`Processing ${recentEntries.length} total entries`);

    recentEntries.forEach(entry => {
        const entryDate = new Date(entry.published);
        logDebug(`Processing entry from ${entryDate.toISOString()}`);

        const textLower = `${entry.title} ${entry.description || ''}`.toLowerCase();

        celebsList.forEach(celeb => {
            if (textLower.includes(celeb.toLowerCase())) {
                mentionCounts.set(celeb, (mentionCounts.get(celeb) || 0) + 1);
            }
        });
    });

    // Sort and categorize
    const sortedMentions = Array.from(mentionCounts.entries())
        .sort((a, b) => b[1] - a[1]);

    logDebug('\nMention counts:');
    sortedMentions.forEach(([celeb, count]) => {
        logDebug(`${celeb}: ${count} mentions`);
    });

    // Categorize with adjusted thresholds
    const categories = {
        hot_this_week: [],
        not_this_week: [],
        upcoming_new_names: []
    };

    sortedMentions.forEach(([celeb, count]) => {
        if (count >= 2) { // Lowered threshold for hot
            categories.hot_this_week.push([celeb, count]);
        } else if (count === 1) {
            categories.upcoming_new_names.push([celeb, count]);
        } else {
            categories.not_this_week.push([celeb, count]);
        }
    });

    // Add celebrities with no mentions to "not" category
    celebsList.forEach(celeb => {
        if (!mentionCounts.has(celeb)) {
            categories.not_this_week.push([celeb, 0]);
        }
    });

    // Update data object
    data.hot_this_week = categories.hot_this_week;
    data.not_this_week = categories.not_this_week;
    data.upcoming_new_names = categories.upcoming_new_names;
    data.weekly_popularity = sortedMentions.slice(0, 20);

    // Save cleaned data
    logDebug('Saving cleaned data...');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(debugLogPath, debugLog.join('\n'));

    logDebug('Cleanup completed successfully');
    logDebug(`- Hot celebrities: ${categories.hot_this_week.length}`);
    logDebug(`- Upcoming celebrities: ${categories.upcoming_new_names.length}`);
    logDebug(`- Not trending: ${categories.not_this_week.length}`);

} catch (error) {
    logDebug(`ERROR: ${error.message}`);
    logDebug(error.stack);
    process.exit(1);
}
