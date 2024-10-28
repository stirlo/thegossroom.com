import arxiv
import json
from pathlib import Path
from datetime import datetime, timedelta

class AIResearchScraper:
    def __init__(self):
        self.base_path = Path('tech/AI/data')
        self.output_file = self.base_path / 'research.json'
        self.categories = ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV', 'cs.RO']

    def fetch_papers(self):
        client = arxiv.Client()

        # Search for papers from last 7 days
        date_filter = datetime.now() - timedelta(days=7)

        search = arxiv.Search(
            query = ' OR '.join(f'cat:{cat}' for cat in self.categories),
            max_results = 100,
            sort_by = arxiv.SortCriterion.SubmittedDate
        )

        papers = []
        for result in client.results(search):
            paper = {
                'title': result.title,
                'authors': [author.name for author in result.authors],
                'summary': result.summary,
                'link': result.pdf_url,
                'published': result.published.isoformat(),
                'categories': result.categories,
                'doi': result.doi
            }
            papers.append(paper)

        return papers

    def update(self):
        papers = self.fetch_papers()

        output_data = {
            'last_updated': datetime.now().isoformat(),
            'papers': papers
        }

        self.base_path.mkdir(parents=True, exist_ok=True)
        with open(self.output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

if __name__ == '__main__':
    scraper = AIResearchScraper()
    scraper.update()

