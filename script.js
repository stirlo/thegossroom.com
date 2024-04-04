const contentContainer = document.querySelector('.content-container');
const paginationContainer = document.querySelector('.pagination');
const postsPerPage = 15;
let currentPage = 1;

function displayPosts(posts) {
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

  contentContainer.innerHTML = marked(currentPosts.join('\n'));
}

function displayPagination(totalPosts) {
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  let paginationHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `<a href="#" data-page="${i}">${i}</a>`;
  }

  paginationContainer.innerHTML = paginationHTML;
  paginationContainer.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      currentPage = parseInt(event.target.dataset.page);
      fetchPosts();
    }
  });
}

async function fetchPosts() {
  const owner = 'stirlo';
  const repo = 'thegossroom.com';
  const path = 'archive';

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(apiUrl);
  const files = await response.json();

  const posts = [];

  for (const file of files) {
    if (file.type === 'file' && file.name.endsWith('.md')) {
      const response = await fetch(file.download_url);
      const markdown = await response.text();
      posts.push(...markdown.split('\n\n'));
    }
  }

  posts.reverse();

  displayPosts(posts);
  displayPagination(posts.length);
}

function setCurrentYear() {
  const currentYearElement = document.getElementById('currentYear');
  const currentYear = new Date().getFullYear();
  currentYearElement.textContent = currentYear;
}

setCurrentYear();
fetchPosts();
