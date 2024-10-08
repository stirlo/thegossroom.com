# Section 1: Imports and Initial Setup
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

# Section 2: Data Management Functions
def ensure_data_directory():
    if not os.path.exists('data'):
        os.makedirs('data')

def initialize_gossip_data():
    empty_data = {
        "entries": [],
        "fallback_entries": [],
        "hourly_topics": {str(i): [] for i in range(1, 11)},
        "weekly_popularity": [],
        "hot_this_week": [],
        "not_this_week": [],
        "upcoming_new_names": []
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

# Section 3: RSS Feed Processing
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

# Section 4: Entry Processing and Filtering
def filter_entries_by_topics(entries, topics):
    filtered_entries = []
    for entry in entries:
        entry_topics = []
        for topic in topics:
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

# Section 5: Celebrity and Topic Management
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
    topic_mentions = Counter()
    for entry in entries:
        for topic in entry.get('topics', []):
            topic_mentions[topic] += 1

    # Update list of topics
    updated_topics = list(set(current_topics + list(topic_mentions.keys())))

    # Add new celebrities
    existing_topics = set(updated_topics)
    new_celebrities = extract_potential_celebrities(entries, existing_topics)
    updated_topics.extend(new_celebrities)

    # Remove duplicates and sort alphabetically
    updated_topics = sorted(set(updated_topics))

    save_hot_topics(updated_topics)
    return updated_topics

# Section 6: Topic Analysis
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

def update_weekly_popularity(new_data, existing_data):
    topic_dict = {}
    # Combine existing and new data
    for item in existing_data + new_data:
        if len(item) >= 2: # Ensure we have at least topic and count
            topic, count = item[0], item[1]
            articles = item[2] if len(item) > 2 else []
            if topic in topic_dict:
                topic_dict[topic]['count'] += count
                topic_dict[topic]['articles'].extend(articles)
            else:
                topic_dict[topic] = {'count': count, 'articles': articles}
    # Sort by count and convert back to list of tuples
    sorted_topics = sorted(topic_dict.items(), key=lambda x: x[1]['count'], reverse=True)
    return [(topic, data['count'], data['articles']) for topic, data in sorted_topics]

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

# Section 7: Entry and Category Generation
def generate_fallback_entries(weekly_popularity):
    fallback_entries = []
    for topic, count, articles in weekly_popularity:
        for article in articles[:min(count, 5)]: # Add up to 5 articles for each topic
            if article not in fallback_entries:
                article['is_fallback'] = True
                fallback_entries.append(article)
    return format_entries(fallback_entries)

def get_celebrity_categories(entries, hot_topics):
    topic_mentions = Counter()
    for entry in entries:
        for topic in entry.get('topics', []):
            topic_mentions[topic] += 1
    hot_this_week = []
    not_this_week = []
    for topic in hot_topics:
        if topic_mentions[topic] > 0:
            hot_this_week.append((topic, topic_mentions[topic]))
        else:
            not_this_week.append(topic)
    # Sort hot_this_week by mentions and limit to top 10
    hot_this_week.sort(key=lambda x: x[1], reverse=True)
    hot_this_week = hot_this_week[:10]
    # Limit not_this_week to bottom 10
    not_this_week = not_this_week[-10:]
    # Get upcoming new names
    existing_topics = set(hot_topics)
    upcoming_new_names = [
        (topic, count) for topic, count in topic_mentions.items()
        if topic not in existing_topics and count >= 5 # Adjust the threshold as needed
    ]
    upcoming_new_names.sort(key=lambda x: x[1], reverse=True)
    upcoming_new_names = upcoming_new_names[:10] # Limit to top 10
    return hot_this_week, not_this_week, upcoming_new_names

def generate_celebrity_ranks():
    file_path = 'data/weekly_popularity.json'
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            weekly_popularity = json.load(f)
        # Create a dictionary of celebrity ranks
        celebrity_ranks = {}
        for topic, count, _ in weekly_popularity:
            celebrity_ranks[topic] = count
        # Normalize the ranks to a 0-100 scale
        max_count = max(celebrity_ranks.values())
        for celebrity, count in celebrity_ranks.items():
            celebrity_ranks[celebrity] = int((count / max_count) * 100)
        # Save the celebrity ranks
        with open('data/celebrity_ranks.json', 'w') as f:
            json.dump(celebrity_ranks, f, indent=2)
        logger.info("Generated celebrity ranks")
    else:
        logger.warning("Weekly popularity data not found. Unable to generate celebrity ranks.")

# Section 8: Main Function
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
    hot_this_week, not_this_week, upcoming_new_names = get_celebrity_categories(formatted_entries, hot_topics)
    logger.info(f"Generated celebrity categories")
    hourly_topics = get_hourly_topics(formatted_entries)
    logger.info(f"Generated hourly topics")
    weekly_popularity = calculate_weekly_popularity(formatted_entries)
    logger.info(f"Calculated weekly popularity")
    fallback_entries = generate_fallback_entries(weekly_popularity)
    logger.info(f"Generated {len(fallback_entries)} fallback entries")
    with open('data/gossip_data.json', 'w') as f:
        json.dump({
            'entries': formatted_entries,
            'fallback_entries': fallback_entries,
            'hourly_topics': hourly_topics,
            'weekly_popularity': weekly_popularity,
            'hot_this_week': hot_this_week,
            'not_this_week': not_this_week,
            'upcoming_new_names': upcoming_new_names
        }, f, default=str)
    logger.info("Saved gossip data to file")
    save_processed_articles(processed_articles)
    logger.info("Saved processed articles")
    generate_celebrity_ranks()
    logger.info("Gossip update process completed")

if __name__ == "__main__":
    main()
