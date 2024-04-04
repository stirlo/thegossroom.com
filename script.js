const contentContainer = document.querySelector('.content-container');
const paginationContainer = document.querySelector('.pagination');
const postsPerPage = 20; // Adjust based on your preference
let currentPage = 1;
let htmlContentPages = [];

async function fetchPosts() {
  const owner = 'stirlo';
  const repo = 'thegossroom.com';
  const path = 'archive';

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  contentContainer.innerHTML = '<p>Loading posts...</p>';

  const response = await fetch(apiUrl);
  const files = await response.json();

  let markdownContent = '';
  for (const file of files.reverse()) {
    if (file.type === 'file' && file.name.endsWith('.md')) {
      const fileResponse = await fetch(file.download_url);
      const markdown = await fileResponse.text();
      markdownContent += markdown + '\n\n';
    }
  }

  const htmlContent = marked(markdownContent);
  splitIntoPages(htmlContent);
  displayCurrentPage();
  displayPagination();
}

function splitIntoPages(htmlContent) {
  const charsPerPage = 10000; // Example character count, adjust as needed
  for (let i = 0; i < htmlContent.length; i += charsPerPage) {
    htmlContentPages.push(htmlContent.substring(i, i + charsPerPage));
  }
}

function displayCurrentPage() {
  contentContainer.innerHTML = htmlContentPages[currentPage - 1];
}

function displayPagination() {
  paginationContainer.innerHTML = '';
  for (let i = 1; i <= htmlContentPages.length; i++) {
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.innerText = i;
    pageLink.addEventListener('click', () => {
      currentPage = i;
      displayCurrentPage();
    });
    paginationContainer.appendChild(pageLink);
  }
}

function setCurrentYear() {
  const currentYearElement = document.getElementById('currentYear');
  const currentYear = new Date().getFullYear();
  currentYearElement.textContent = currentYear;
}

setCurrentYear();
fetchPosts();

