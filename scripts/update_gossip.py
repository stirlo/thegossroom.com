import feedparser
import json
from datetime import datetime, timedelta
import hashlib
import os
from collections import Counter
import re
import pytz

# Common words to exclude from potential celebrity names
COMMON_WORDS = set(['in', 'new', 'to', 'for', 'her', 'his', 'after', 'tv', 'with', 'out', 'from', 'the', 'is', 'how', 'reveals', 'are', 'of', 'a', 'and', 'about', 'why', 'so', 'says', 'i', 'uk'])

def ensure_data_directory():
    if not os.path.exists('data'):
        os.makedirs('data')

def initialize_gossip_data():
    """
    Initialize the gossip data file with an empty structure.
    """
    empty_data = {
        "entries": [],
        "hourly_topics": {str(i): [] for i in range(1, 11)}
    }
    ensure_data_directory()
    with open('data/gossip_data.json', 'w') as f:
        json.dump(empty_data, f)

def load_rss_feeds():
    with open('rss.txt', 'r') as f:
        return [line.strip() for line in f if line.strip()]

def load_hot_topics():
    with open('celebrities.txt', 'r') as f:
        return [line.strip() for line in f if line.strip()]

def save_hot_topics(topics):
    with open('celebrities.txt', 'w') as f:
        for topic in topics:
            f.write(f"{topic}\n")

def load_processed_articles():
    ensure_data_directory()
    if os.path.exists('data/processed_articles.json'):
        with open('data/processed_articles.json', 'r') as f:
            return json.load(f)
    return {}

def save_processed_articles(articles):
    ensure_data_directory()
    with open('data/processed_articles.json', 'w') as f:
        json.dump(articles, f)

def is_article_new(article_id, processed_articles):
    return article_id not in processed_articles

def fetch_and_parse_feeds(rss_feeds, processed_articles):
    all_entries = []
    for feed_url in rss_feeds:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                parsed_entry = {
                    "title": entry.get('title', ''),
                    "link": entry.get('link', ''),
                    "published": entry.get('published', entry.get('updated', '')),
                    "summary": entry.get('summary', '')
                }
                parsed_entry['id'] = hashlib.md5(parsed_entry['link'].encode()).hexdigest()
                if is_article_new(parsed_entry['id'], processed_articles):
                    all_entries.append(parsed_entry)
                    processed_articles[parsed_entry['id']] = {
                        'title': parsed_entry['title'],
                        'link': parsed_entry['link'],
                        'published': parsed_entry['published']
                    }
        except Exception as e:
            print(f"Error processing feed {feed_url}: {str(e)}")

    return all_entries, processed_articles

def filter_entries_by_topics(entries, topics):
    filtered_entries = []
    for entry in entries:
        entry_topics = [topic for topic in topics if topic.lower() in entry['title'].lower()]
        if entry_topics:
            entry['topics'] = entry_topics
            filtered_entries.append(entry)
    return filtered_entries

def format_entries(entries):
    # Sort all entries by date, newest first
    sorted_entries = sorted(entries, key=lambda x: datetime.strptime(x['published'], "%a, %d %b %Y %H:%M:%S %z"), reverse=True)

    # Remove duplicates while preserving order
    seen = set()
    unique_entries = []
    for entry in sorted_entries:
        if entry['id'] not in seen:
            seen.add(entry['id'])
            unique_entries.append(entry)

    return unique_entries

def extract_potential_celebrities(entries, existing_topics):
    all_titles = ' '.join([entry['title'] for entry in entries])
    potential_names = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b', all_titles)
    name_counts = Counter(potential_names)

    new_celebrities = [
        name for name, count in name_counts.items()
        if count >= 10
        and name.lower() not in COMMON_WORDS
        and all(word.lower() not in COMMON_WORDS for word in name.split())
        and name not in existing_topics
    ]

    single_word_names = re.findall(r'\b([A-Z][a-z]+)\b', all_titles)
    single_word_counts = Counter(single_word_names)
    new_celebrities.extend([
        name for name, count in single_word_counts.items()
        if count >= 20
        and name.lower() not in COMMON_WORDS
        and name not in existing_topics
    ])

    return list(set(new_celebrities))

def update_hot_topics(entries, current_topics):
    new_celebrities = extract_potential_celebrities(entries, current_topics)
    updated_topics = list(set(current_topics + new_celebrities))
    save_hot_topics(updated_topics)
    return updated_topics

def get_hourly_topics(entries):
    now = datetime.now(pytz.UTC)
    hourly_topics = {str(i): set() for i in range(1, 11)}

    for entry in entries:
        entry_time = datetime.strptime(entry['published'], "%a, %d %b %Y %H:%M:%S %z").replace(tzinfo=pytz.UTC)
        hours_ago = (now - entry_time).total_seconds() / 3600

        if hours_ago <= 10:
            hour_bucket = min(10, max(1, int(hours_ago) + 1))
            hourly_topics[str(hour_bucket)].update(entry['topics'])

    # Convert sets to lists for JSON serialization
    return {k: list(v) for k, v in hourly_topics.items()}

def main():
    ensure_data_directory()

    if not os.path.exists('data/gossip_data.json') or os.path.getsize('data/gossip_data.json') == 0:
        initialize_gossip_data()

    rss_feeds = load_rss_feeds()
    hot_topics = load_hot_topics()
    processed_articles = load_processed_articles()

    entries, processed_articles = fetch_and_parse_feeds(rss_feeds, processed_articles)

    hot_topics = update_hot_topics(entries, hot_topics)

    filtered_entries = filter_entries_by_topics(entries, hot_topics)
    formatted_entries = format_entries(filtered_entries)

    hourly_topics = get_hourly_topics(formatted_entries)

    with open('data/gossip_data.json', 'w') as f:
        json.dump({
            'entries': formatted_entries,
            'hourly_topics': hourly_topics
        }, f, default=str)

    save_processed_articles(processed_articles)

if __name__ == "__main__":
    main()
