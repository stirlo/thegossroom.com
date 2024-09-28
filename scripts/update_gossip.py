import feedparser
import json
from datetime import datetime, timedelta
import hashlib
import os
from collections import Counter, defaultdict
import re
import pytz
import logging
from dateutil import parser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COMMON_WORDS = set(['in', 'new', 'to', 'for', 'her', 'his', 'after', 'tv', 'with', 'out', 'from', 'the', 'is', 'how', 'reveals', 'are', 'of', 'a', 'and', 'about', 'why', 'so', 'says', 'i', 'uk'])

# ... [All other functions remain the same] ...

def update_weekly_popularity(new_data, existing_data):
    # Merge new data with existing data
    topic_data = defaultdict(lambda: {'count': 0, 'articles': []})

    for topic, count, articles in existing_data + new_data:
        topic_data[topic]['count'] += count
        topic_data[topic]['articles'].extend(articles)

    # Sort by count (descending) and keep top 10
    sorted_data = sorted(
        [(topic, data['count'], data['articles']) for topic, data in topic_data.items()],
        key=lambda x: x[1],
        reverse=True
    )[:10]

    return sorted_data

def calculate_weekly_popularity(entries):
    one_week_ago = datetime.now(pytz.UTC) - timedelta(days=7)
    recent_entries = [entry for entry in entries if parse_date(entry['published']) > one_week_ago]
    topic_mentions = Counter()
    topic_articles = defaultdict(list)

    for entry in recent_entries:
        for topic in entry['topics']:
            topic_mentions[topic] += 1
            topic_articles[topic].append(entry)

    new_data = [(topic, count, topic_articles[topic]) for topic, count in topic_mentions.items()]

    # Load existing data
    file_path = 'data/weekly_popularity.json'
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    updated_data = update_weekly_popularity(new_data, existing_data)

    # Write updated data back to file
    with open(file_path, 'w') as f:
        json.dump(updated_data, f, default=str)

    return updated_data

def generate_articles_from_popularity(weekly_popularity):
    articles = []
    for topic, count, topic_articles in weekly_popularity:
        articles.extend(topic_articles[:count])  # Add up to 'count' articles for each topic

    # Sort articles by date and remove duplicates
    sorted_articles = sorted(articles, key=lambda x: parse_date(x['published']), reverse=True)
    unique_articles = []
    seen = set()
    for article in sorted_articles:
        if article['id'] not in seen:
            seen.add(article['id'])
            article['is_fallback'] = True  # Flag these articles as fallback content
            unique_articles.append(article)

    return unique_articles

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

    if not formatted_entries:
        logger.info("No new entries found, generating articles from weekly popularity")
        fallback_entries = generate_articles_from_popularity(weekly_popularity)
        logger.info(f"Generated {len(fallback_entries)} articles from weekly popularity")
    else:
        fallback_entries = []

    with open('data/gossip_data.json', 'w') as f:
        json.dump({
            'entries': formatted_entries,
            'fallback_entries': fallback_entries,
            'hourly_topics': hourly_topics,
            'weekly_popularity': weekly_popularity
        }, f, default=str)
    logger.info("Saved gossip data to file")
    save_processed_articles(processed_articles)
    logger.info("Saved processed articles")
    logger.info("Gossip update process completed")

if __name__ == "__main__":
    main()
