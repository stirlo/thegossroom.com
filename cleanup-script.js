const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data', 'gossip_data.json');
const celebsPath = path.join(process.cwd(), 'celebrities.txt');
const debugLogPath = path.join(process.cwd(), 'cleanup-debug.log');

const debugLog = [];

function logDebug(message) {
    const logMessage = `[${new Date().toISOString()}] ${message}`;
    debugLog.push(logMessage);
    console.log(logMessage);
}

async function cleanupData() {
    try {
        logDebug('Starting cleanup...');

        // Read and parse data
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        let celebsList = fs.existsSync(celebsPath) 
            ? fs.readFileSync(celebsPath, 'utf8').split('\n').filter(Boolean)
            : [];

        logDebug(`Initial entries count: ${data.entries?.length || 0}`);

        // Store drama scores
        const dramaScores = new Map();
        if (data.entries) {
            data.entries.forEach(entry => {
                if (entry.dramaScore) {
                    dramaScores.set(entry.url, entry.dramaScore);
                }
            });
        }

        // Set 7-day window
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        logDebug(`Filtering entries older than ${oneWeekAgo.toISOString()}`);

        // Filter entries
        const originalCount = data.entries?.length || 0;
        const originalFallbackCount = data.fallback_entries?.length || 0;

        data.entries = (data.entries || []).filter(entry => {
            const entryDate = new Date(entry.published);
            return entryDate > oneWeekAgo;
        });

        // Restore drama scores
        data.entries.forEach(entry => {
            if (dramaScores.has(entry.url)) {
                entry.dramaScore = dramaScores.get(entry.url);
            }
        });

        // Filter fallback entries
        data.fallback_entries = (data.fallback_entries || []).filter(entry => {
            const entryDate = new Date(entry.published);
            return entryDate > oneWeekAgo;
        });

        // Process celebrity mentions
        const mentionCounts = new Map();
        const recentEntries = [...data.entries, ...data.fallback_entries];

        logDebug(`Processing ${recentEntries.length} total entries for mentions`);

        recentEntries.forEach(entry => {
            const textLower = `${entry.title} ${entry.description || ''}`.toLowerCase();
            celebsList.forEach(celeb => {
                if (textLower.includes(celeb.toLowerCase())) {
                    mentionCounts.set(celeb, (mentionCounts.get(celeb) || 0) + 1);
                }
            });
        });

        // Categorize mentions
        const categories = {
            hot_this_week: [],
            not_this_week: [],
            upcoming_new_names: []
        };

        const sortedMentions = Array.from(mentionCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        sortedMentions.forEach(([celeb, count]) => {
            if (count >= 2) {
                categories.hot_this_week.push([celeb, count]);
            } else if (count === 1) {
                categories.upcoming_new_names.push([celeb, count]);
            } else {
                categories.not_this_week.push([celeb, count]);
            }
        });

        // Add unmentioned celebrities
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
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        fs.writeFileSync(debugLogPath, debugLog.join('\n'));

        logDebug('Cleanup complete:');
        logDebug(`- Removed ${originalCount - data.entries.length} main entries`);
        logDebug(`- Removed ${originalFallbackCount - data.fallback_entries.length} fallback entries`);
        logDebug(`- Preserved ${dramaScores.size} drama scores`);
        logDebug(`- Hot celebrities: ${categories.hot_this_week.length}`);
        logDebug(`- Upcoming celebrities: ${categories.upcoming_new_names.length}`);
        logDebug(`- Not trending: ${categories.not_this_week.length}`);

        return true;
    } catch (error) {
        logDebug(`ERROR during cleanup: ${error.message}`);
        logDebug(error.stack);
        throw error;
    }
}

cleanupData().catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
});
