import feedparser
import json
import os
from datetime import datetime
from pathlib import Path
import hashlib
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords

nltk.download('punkt')
nltk.download('stopwords')

class AINewsScraper:
    def __init__(self):
        self.base_path = Path('tech/AI/data')
        self.rss_file = Path('tech/AI/rss.txt')
        self.topics_file = Path('tech/AI/topics.txt')
        self.output_file = self.base_path / 'current.json'

    def load_feeds(self):
        with open(self.rss_file, 'r') as f:
            return [line.strip() for line in f if line.strip()]

    def load_topics(self):
        with open(self.topics_file, 'r') as f:
            return [line.strip().lower() for line in f if line.strip()]

    def is_relevant(self, text, topics):
        text = text.lower()
        return any(topic in text for topic in topics)

    def parse_feed(self, feed_url):
        try:
            feed = feedparser.parse(feed_url)
            articles = []

            for entry in feed.entries[:10]:  # Get latest 10 entries
                article = {
                    'title': entry.get('title', ''),
                    'link': entry.get('link', ''),
                    'published': entry.get('published', ''),
                    'summary': entry.get('summary', ''),
                    'source': feed.feed.title,
                    'id': hashlib.md5(entry.get('link', '').encode()).hexdigest()
                }
                articles.append(article)
            return articles
        except Exception as e:
            print(f"Error parsing feed {feed_url}: {e}")
            return []

    def update(self):
        feeds = self.load_feeds()
        topics = self.load_topics()
        all_articles = []

        for feed_url in feeds:
            articles = self.parse_feed(feed_url)
            relevant_articles = [
                article for article in articles
                if self.is_relevant(article['title'] + article.get('summary', ''), topics)
            ]
            all_articles.extend(relevant_articles)

        # Sort by date
        all_articles.sort(
            key=lambda x: datetime.strptime(x['published'], '%a, %d %b %Y %H:%M:%S %z'),
            reverse=True
        )

        # Save to JSON
        output_data = {
            'last_updated': datetime.now().isoformat(),
            'articles': all_articles[:50]  # Keep latest 50 articles
        }

        self.base_path.mkdir(parents=True, exist_ok=True)
        with open(self.output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

if __name__ == '__main__':
    scraper = AINewsScraper()
    scraper.update()

