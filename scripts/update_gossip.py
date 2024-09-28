import feedparser
import json
from datetime import datetime, timedelta
import hashlib
import os
from collections import Counter
import re
import pytz
import logging
from dateutil import parser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COMMON_WORDS = set(['in', 'new', 'to', 'for', 'her', 'his', 'after', 'tv', 'with', 'out', 'from', 'the', 'is', 'how', 'reveals', 'are', 'of', 'a', 'and', 'about', 'why', 'so', 'says', 'i', 'uk'])

def ensure_data_directory():
    if not os.path.exists('data'):
        os.makedirs('data')

def initialize_gossip_data():
    empty_data = {
        "entries": [],
        "hourly_topics": {str(i): [] for i in range(1, 11)},
        "weekly_popularity": []
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
            logger.error(f"Error processing feed {feed_url}: {str(e)}")
    return all_entries, processed_articles

def filter_entries_by_topics(entries, topics):
    filtered_entries = []
    for entry in entries:
        entry_topics = []
        for topic in topics:
            # Create a regex pattern that matches the whole word
            pattern = r'\b' + re.escape(topic) + r'\b'
            if re.search(pattern, entry['title'], re.IGNORECASE):
                entry_topics.append(topic)
        if entry_topics:
            entry['topics'] = entry_topics
            filtered_entries.append(entry)
    return filtered_entries

def parse_date(date_string):
    try:
        return parser.parse(date_string)
    except ValueError:
        return datetime.min.replace(tzinfo=pytz.UTC)

def format_entries(entries):
    sorted_entries = sorted(entries, key=lambda x: parse_date(x['published']), reverse=True)
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
        entry_time = parse_date(entry['published'])
        if entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=pytz.UTC)
        hours_ago = (now - entry_time).total_seconds() / 3600
        if hours_ago <= 10:
            hour_bucket = min(10, max(1, int(hours_ago) + 1))
            hourly_topics[str(hour_bucket)].update(entry['topics'])
    return {k: list(v) for k, v in hourly_topics.items()}

def update_weekly_popularity(new_data):
    file_path = 'data/weekly_popularity.json'
    ensure_data_directory()

    # Read existing data
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    # Merge new data with existing data
    combined_data = existing_data + new_data

    # Sort by count (descending) and keep top 10
    sorted_data = sorted(combined_data, key=lambda x: x[1], reverse=True)
    top_10 = sorted_data[:10]

    # Write updated data back to file
    with open(file_path, 'w') as f:
        json.dump(top_10, f)

    return top_10

def calculate_weekly_popularity(entries):
    one_week_ago = datetime.now(pytz.UTC) - timedelta(days=7)
    recent_entries = [entry for entry in entries if parse_date(entry['published']) > one_week_ago]
    topic_mentions = Counter()
    for entry in recent_entries:
        for topic in entry['topics']:
            topic_mentions[topic] += 1
    new_data = list(topic_mentions.items())
    return update_weekly_popularity(new_data)

def main():
    logger.info("Starting gossip update process")
    ensure_data_directory()
    if not os.path.exists('data/gossip_data.json') or os.path.getsize('data/gossip_data.json') == 0:
        logger.info("Initializing gossip data file")
        initialize_gossip_data()
    rss_feeds = load_rss_feeds()
    logger.info(f"Loaded {len(rss_feeds)} RSS feeds")
    hot_topics = load_hot_topics()
    logger.info(f"Loaded {len(hot_topics)} hot topics")
    processed_articles = load_processed_articles()
    logger.info(f"Loaded {len(processed_articles)} processed articles")
    entries, processed_articles = fetch_and_parse_feeds(rss_feeds, processed_articles)
    logger.info(f"Fetched {len(entries)} new entries")
    hot_topics = update_hot_topics(entries, hot_topics)
    logger.info(f"Updated hot topics, now have {len(hot_topics)} topics")
    filtered_entries = filter_entries_by_topics(entries, hot_topics)
    logger.info(f"Filtered entries, now have {len(filtered_entries)} entries")
    formatted_entries = format_entries(filtered_entries)
    logger.info(f"Formatted entries, final count: {len(formatted_entries)}")
    hourly_topics = get_hourly_topics(formatted_entries)
    logger.info(f"Generated hourly topics")
    weekly_popularity = calculate_weekly_popularity(formatted_entries)
    logger.info(f"Calculated weekly popularity")

    if not weekly_popularity:
        # If no new data, load the existing data
        file_path = 'data/weekly_popularity.json'
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                weekly_popularity = json.load(f)
        else:
            weekly_popularity = []

    with open('data/gossip_data.json', 'w') as f:
        json.dump({
            'entries': formatted_entries,
            'hourly_topics': hourly_topics,
            'weekly_popularity': weekly_popularity
        }, f, default=str)
    logger.info("Saved gossip data to file")
    save_processed_articles(processed_articles)
    logger.info("Saved processed articles")
    logger.info("Gossip update process completed")

if __name__ == "__main__":
    main()
