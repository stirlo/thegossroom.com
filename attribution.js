document.addEventListener('DOMContentLoaded', function() {
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
});
