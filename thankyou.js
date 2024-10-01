document.addEventListener('DOMContentLoaded', function() {
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
