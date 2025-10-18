console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/portfolio/'; // GitHub Pages repo name

// Step: 2
// const navLinks = $$('nav a');

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

//Step 3.1:
let pages = [
    { url: '', title: 'Home'},
    { url: 'projects/', title: 'Projects'},
    { url: 'CV/', title: 'CV'},
    { url: 'contact/', title: 'Contact'},
    { url: 'https://github.com/oneeljilc', title: 'GitHub'}
]

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith('http')) {
    url = BASE_PATH + url;
    }

    let a = document.createElement('a'); // Step 3.2
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
      a.classList.add('current');
    }

    if (a.host !== location.host) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    nav.append(a);
}

// Step 4 Dark Mode
document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `
);

const select = document.querySelector('.color-scheme select')
const root = document.documentElement

const savedScheme = localStorage.getItem('color-scheme');
if (savedScheme) {
  root.style.setProperty('color-scheme', savedScheme);
  select.value = savedScheme;
} else {
  root.style.setProperty('color-scheme', 'light dark');
  select.value = 'light dark';
}

select.addEventListener('input', function (event) {
  const value = event.target.value;
  root.style.setProperty('color-scheme', value);

  if (value === 'light dark') {
    localStorage.removeItem('color-scheme');
  } else {
    localStorage.setItem('color-scheme', value);
  }

  console.log('color scheme changed to', value);
});

// Lab 4: Step 1.2
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    // Add error message
    if (!Array.isArray(data)) {
      console.warn('Expected an array in JSON file, got:', data);
      return null;
    } 
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}