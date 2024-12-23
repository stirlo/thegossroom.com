import json
from datetime import datetime, timedelta
import dateutil.parser

def clean_json_data(data):
    # Get current date and 7 day threshold
    current_date = datetime.now()
    week_ago = current_date - timedelta(days=7)

    # Track mentioned topics and upcoming names
    recent_topics = set()
    upcoming_names = set()

    # Filter entries newer than 7 days
    recent_entries = []
    for entry in data.get('fallback_entries', []):
        try:
            pub_date = dateutil.parser.parse(entry['published'])
            if pub_date > week_ago:
                recent_entries.append(entry)
                # Add topics from recent entries
                recent_topics.update(entry.get('topics', []))
                # Check summary for upcoming mentions
                summary = entry.get('summary', '').lower()
                title = entry.get('title', '').lower()
                upcoming_keywords = ['upcoming', 'announced', 'will star', 'to star', 'set to', 'joins', 'cast in']
                if any(keyword in summary or keyword in title for keyword in upcoming_keywords):
                    upcoming_names.update(entry.get('topics', []))
        except (ValueError, TypeError):
            continue

    # Update hot_this_week based on recent mentions
    hot_this_week = sorted(list(recent_topics))

    # Update not_this_week by removing hot topics and upcoming names
    not_this_week = sorted([
        name for name in data.get('not_this_week', [])
        if name not in hot_this_week and name not in upcoming_names
    ])

    # Update upcoming_new_names
    upcoming_new_names = sorted(list(upcoming_names))

    cleaned_data = {
        "fallback_entries": recent_entries,
        "hot_this_week": hot_this_week,
        "not_this_week": not_this_week,
        "upcoming_new_names": upcoming_new_names
    }

    # Ensure clean serialization
    return json.loads(json.dumps(cleaned_data))

if __name__ == "__main__":
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        cleaned = clean_json_data(data)

        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(cleaned, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add newline at end of file

    except Exception as e:
        print(f"Error processing JSON: {str(e)}")
        exit(1)
