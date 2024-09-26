import feedparser
import json
from datetime import datetime, timedelta
import hashlib
import os
from collections import Counter

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
    if os.path.exists('data/processed_articles.json'):
        with open('data/processed_articles.json', 'r') as f:
            return json.load(f)
    return {}

def save_processed_articles(articles):
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
    return [entry for entry in entries if any(topic.lower() in entry['title'].lower() for topic in topics)]

def format_entries(entries, topics):
    formatted_content = {}
    for topic in topics:
        topic_entries = [entry for entry in entries if topic.lower() in entry['title'].lower()]
        if topic_entries:
            formatted_content[topic] = sorted(topic_entries, key=lambda x: x['published'], reverse=True)

    return formatted_content

def extract_potential_celebrities(entries, existing_topics):
    words = ' '.join([entry['title'] for entry in entries]).split()
    capitalized_words = [word for word in words if word[0].isupper()]
    potential_celebrities = Counter(capitalized_words)

    new_celebrities = [celeb for celeb, count in potential_celebrities.items() 
                       if count >= 5 and celeb not in existing_topics]

    return new_celebrities

def update_hot_topics(entries, current_topics):
    new_celebrities = extract_potential_celebrities(entries, current_topics)
    updated_topics = current_topics + new_celebrities
    save_hot_topics(updated_topics)
    return updated_topics

def main():
    rss_feeds = load_rss_feeds()
    hot_topics = load_hot_topics()
    processed_articles = load_processed_articles()

    entries, processed_articles = fetch_and_parse_feeds(rss_feeds, processed_articles)

    hot_topics = update_hot_topics(entries, hot_topics)

    filtered_entries = filter_entries_by_topics(entries, hot_topics)
    formatted_content = format_entries(filtered_entries, hot_topics)

    with open('data/gossip_data.json', 'w') as f:
        json.dump(formatted_content, f, default=str)

    save_processed_articles(processed_articles)

if __name__ == "__main__":
    main()
