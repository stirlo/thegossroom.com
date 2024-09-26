import feedparser
import json
from datetime import datetime, timedelta
import hashlib
import os
from collections import Counter

def ensure_data_directory():
    """
    Ensure that the 'data' directory exists.
    """
    if not os.path.exists('data'):
        os.makedirs('data')

def load_rss_feeds():
    """
    Load RSS feed URLs from rss.txt file.

    Returns:
    list: A list of RSS feed URLs.
    """
    with open('rss.txt', 'r') as f:
        return [line.strip() for line in f if line.strip()]

def load_hot_topics():
    """
    Load celebrity names from celebrities.txt file.

    Returns:
    list: A list of celebrity names.
    """
    with open('celebrities.txt', 'r') as f:
        return [line.strip() for line in f if line.strip()]

def save_hot_topics(topics):
    """
    Save updated list of celebrity names to celebrities.txt file.

    Args:
    topics (list): List of celebrity names to save.
    """
    with open('celebrities.txt', 'w') as f:
        for topic in topics:
            f.write(f"{topic}\n")

def load_processed_articles():
    """
    Load previously processed articles from JSON file.

    Returns:
    dict: A dictionary of processed article IDs and their details.
    """
    ensure_data_directory()
    if os.path.exists('data/processed_articles.json'):
        with open('data/processed_articles.json', 'r') as f:
            return json.load(f)
    return {}

def save_processed_articles(articles):
    """
    Save processed articles to JSON file.

    Args:
    articles (dict): Dictionary of processed article IDs and their details.
    """
    ensure_data_directory()
    with open('data/processed_articles.json', 'w') as f:
        json.dump(articles, f)

def is_article_new(article_id, processed_articles):
    """
    Check if an article has been processed before.

    Args:
    article_id (str): Unique identifier for the article.
    processed_articles (dict): Dictionary of previously processed articles.

    Returns:
    bool: True if the article is new, False otherwise.
    """
    return article_id not in processed_articles

def fetch_and_parse_feeds(rss_feeds, processed_articles):
    """
    Fetch and parse RSS feeds, extracting new articles.

    Args:
    rss_feeds (list): List of RSS feed URLs to process.
    processed_articles (dict): Dictionary of previously processed articles.

    Returns:
    tuple: A list of new entries and an updated dictionary of processed articles.
    """
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
    """
    Filter entries based on whether they mention any of the given topics.

    Args:
    entries (list): List of article entries.
    topics (list): List of topics (celebrity names) to filter by.

    Returns:
    list: Filtered list of entries that mention at least one topic.
    """
    return [entry for entry in entries if any(topic.lower() in entry['title'].lower() for topic in topics)]

def format_entries(entries, topics):
    """
    Format entries into a dictionary grouped by topics.

    Args:
    entries (list): List of article entries.
    topics (list): List of topics (celebrity names) to group by.

    Returns:
    dict: A dictionary with topics as keys and lists of relevant articles as values.
    """
    formatted_content = {}
    for topic in topics:
        topic_entries = [entry for entry in entries if topic.lower() in entry['title'].lower()]
        if topic_entries:
            formatted_content[topic] = sorted(topic_entries, key=lambda x: x['published'], reverse=True)

    return formatted_content

def extract_potential_celebrities(entries, existing_topics):
    """
    Extract potential new celebrities from article titles.

    Args:
    entries (list): List of article entries.
    existing_topics (list): List of existing celebrity names.

    Returns:
    list: List of potential new celebrities.
    """
    words = ' '.join([entry['title'] for entry in entries]).split()
    capitalized_words = [word for word in words if word[0].isupper()]
    potential_celebrities = Counter(capitalized_words)

    new_celebrities = [celeb for celeb, count in potential_celebrities.items() 
                       if count >= 5 and celeb not in existing_topics]

    return new_celebrities

def update_hot_topics(entries, current_topics):
    """
    Update the list of hot topics (celebrities) based on new entries.

    Args:
    entries (list): List of article entries.
    current_topics (list): Current list of celebrity names.

    Returns:
    list: Updated list of celebrity names.
    """
    new_celebrities = extract_potential_celebrities(entries, current_topics)
    updated_topics = current_topics + new_celebrities
    save_hot_topics(updated_topics)
    return updated_topics

def main():
    """
    Main function to orchestrate the gossip data update process.
    """
    # Load necessary data
    rss_feeds = load_rss_feeds()
    hot_topics = load_hot_topics()
    processed_articles = load_processed_articles()

    # Fetch and parse new entries
    entries, processed_articles = fetch_and_parse_feeds(rss_feeds, processed_articles)

    # Update hot topics based on new entries
    hot_topics = update_hot_topics(entries, hot_topics)

    # Filter and format entries
    filtered_entries = filter_entries_by_topics(entries, hot_topics)
    formatted_content = format_entries(filtered_entries, hot_topics)

    # Ensure data directory exists
    ensure_data_directory()

    # Save updated gossip data
    with open('data/gossip_data.json', 'w') as f:
        json.dump(formatted_content, f, default=str)

    # Save updated list of processed articles
    save_processed_articles(processed_articles)

if __name__ == "__main__":
    main()
