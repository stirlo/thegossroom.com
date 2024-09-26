# The Gossip Room

## Overview

The Gossip Room is an automated celebrity gossip aggregator that collects and displays the latest celebrity news from various reputable sources. This project uses web scraping techniques and natural language processing to curate up-to-date, relevant gossip about popular celebrities.

## Features

- Automated collection of celebrity gossip from multiple RSS feeds
- Dynamic updating of celebrity list based on trending topics
- Responsive web design for optimal viewing on various devices
- Attribution page to acknowledge and link to original sources
- GitHub Actions for automated hourly updates

## Technology Stack

- Python (for web scraping and data processing)
- HTML/CSS/JavaScript (for the frontend)
- GitHub Pages (for hosting)
- GitHub Actions (for automation)

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/thegossiproom.git
   ```

2. Navigate to the project directory:
   ```
   cd thegossiproom
   ```

3. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

4. Set up your RSS feeds:
   Edit the `rss.txt` file to include the RSS feed URLs you want to scrape.

5. Initialize your celebrity list:
   Edit the `celebrities.txt` file to include initial celebrity names.

6. Push your changes to GitHub:
   ```
   git add .
   git commit -m &quot;Initial setup&quot;
   git push origin main
   ```

7. Set up GitHub Pages:
   Go to your repository settings on GitHub and enable GitHub Pages for the main branch.

## Usage

The website will automatically update hourly via GitHub Actions. To manually trigger an update:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Update Gossip Data" workflow
3. Click "Run workflow"

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- Thanks to all the news sources listed on our [Attribution](https://yourusername.github.io/thegossiproom/attribution.html) page.
- Built with love for celebrity gossip enthusiasts everywhere.
