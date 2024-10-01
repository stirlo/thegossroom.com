document.addEventListener('DOMContentLoaded', function() {
    // Fetch and populate the source list
    fetch('rss.txt')
        .then(response => response.text())
        .then(data => {
            const sources = data.split('\n').filter(line => line.trim() !== '');
            const sourceList = document.getElementById('sourceList');
            sources.forEach(source => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = new URL(source).origin;
                a.textContent = new URL(source).hostname.replace('www.', '');
                a.target = '_blank';
                li.appendChild(a);
                sourceList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching RSS sources:', error);
            document.getElementById('sourceList').innerHTML = '<li>Unable to load sources. Please try again later.</li>';
        });

    // Fetch and populate the thank you list
    fetch('thankyou.txt')
        .then(response => response.text())
        .then(data => {
            const items = data.split('\n').filter(line => line.trim() !== '');
            const thankYouList = document.getElementById('thankYouList');
            items.forEach(item => {
                const li = document.createElement('li');
                const match = item.match(/(.*) by \[(.*)\]\((.*)\)/);

                if (match) {
                    const [, product, company, url] = match;
                    const a = document.createElement('a');
                    a.href = url;
                    a.textContent = company;
                    a.target = '_blank';
                    li.textContent = `${product} by `;
                    li.appendChild(a);
                } else {
                    li.textContent = item;
                }

                thankYouList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching thank you list:', error);
            document.getElementById('thankYouList').innerHTML = '<li>Unable to load thank you list. Please try again later.</li>';
        });
});
