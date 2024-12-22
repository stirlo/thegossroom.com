// Add logging and error handling
const fs = require('fs');

// Helper function for logging
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

try {
    // Ensure data directory exists
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
        log('Created data directory');
    }

    // Initialize or read gossip_data.json with error handling
    const filePath = 'data/gossip_data.json';
    let data;

    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            data = JSON.parse(fileContent);
            log(`Successfully loaded JSON file (${(fileContent.length / 1024 / 1024).toFixed(2)}MB)`);
            log(`Found ${data.entries.length} entries and ${data.fallback_entries.length} fallback entries`);
        } else {
            data = {
                entries: [],
                fallback_entries: [],
                hourly_topics: {
                    "1": [], "2": [], "3": [], "4": [], "5": [],
                    "6": [], "7": [], "8": [], "9": [], "10": []
                },
                weekly_popularity: [],
                hot_this_week: [],
                not_this_week: [],
                upcoming_new_names: []
            };
            log('Created new data structure');
        }
    } catch (error) {
        log(`Error reading/parsing JSON: ${error.message}`);
        throw error;
    }

    // Read celebrities.txt with logging
    const celebsPath = 'celebrities.txt';
    let celebsList = [];
    try {
        if (fs.existsSync(celebsPath)) {
            celebsList = fs.readFileSync(celebsPath, 'utf8')
                .split('\n')
                .filter(Boolean)
                .map(name => name.toLowerCase().trim());
            log(`Loaded ${celebsList.length} celebrities from file`);
        } else {
            fs.writeFileSync(celebsPath, '');
            log('Created empty celebrities.txt');
        }
    } catch (error) {
        log(`Error reading celebrities.txt: ${error.message}`);
        throw error;
    }

    // Process in chunks if data is large
    const chunkSize = 100; // Process 100 entries at a time
    const mentionCounts = new Map();
    const newNameFrequencies = new Map();
    const properNameRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;

    celebsList.forEach(celeb => mentionCounts.set(celeb, 0));

    // Process entries in chunks
    function processEntriesChunk(entries, startIdx) {
        const endIdx = Math.min(startIdx + chunkSize, entries.length);
        const chunk = entries.slice(startIdx, endIdx);

        chunk.forEach(entry => {
            const textLower = `${entry.title} ${entry.description || ''}`.toLowerCase();
            const textOriginal = `${entry.title} ${entry.description || ''}`;

            celebsList.forEach(celeb => {
                if (textLower.includes(celeb)) {
                    mentionCounts.set(celeb, (mentionCounts.get(celeb) || 0) + 1);
                }
            });

            const matches = textOriginal.match(properNameRegex) || [];
            matches.forEach(name => {
                const normalized = name.toLowerCase().trim();
                if (!celebsList.includes(normalized)) {
                    newNameFrequencies.set(name, (newNameFrequencies.get(name) || 0) + 1);
                }
            });
        });

        return endIdx < entries.length ? processEntriesChunk(entries, endIdx) : Promise.resolve();
    }

    // Process all entries
    const allEntries = [...data.entries, ...data.fallback_entries];
    log(`Processing ${allEntries.length} total entries`);

    await processEntriesChunk(allEntries, 0);

    // Update lists with logging
    data.hot_this_week = Array.from(mentionCounts.entries())
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => [name, count])
        .sort((a, b) => b[1] - a[1]);
    log(`Updated hot_this_week with ${data.hot_this_week.length} entries`);

    data.not_this_week = Array.from(mentionCounts.entries())
        .filter(([_, count]) => count === 0)
        .map(([name]) => name)
        .sort();
    log(`Updated not_this_week with ${data.not_this_week.length} entries`);

    // Log potential new celebrities
    const newCelebs = Array.from(newNameFrequencies.entries())
        .filter(([_, count]) => count >= 3)
        .map(([name]) => name);
    log(`Found ${newCelebs.length} potential new celebrities`);

    if (newCelebs.length > 0) {
        const updatedCelebs = [...new Set([...celebsList, ...newCelebs.map(name => name.toLowerCase())])];
        fs.writeFileSync(celebsPath, updatedCelebs.sort().join('\n') + '\n');
        log(`Added ${updatedCelebs.length - celebsList.length} new celebrities`);
    }

    // Write updated JSON with size check
    const jsonOutput = JSON.stringify(data, null, 2);
    log(`Output JSON size: ${(jsonOutput.length / 1024 / 1024).toFixed(2)}MB`);
    fs.writeFileSync(filePath, jsonOutput);
    log('Successfully wrote updated JSON file');

} catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
}
