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

// Lab 4: Step 1.4
export function renderProjects(project, containerElement) {
  // Check if containerElement is valid
  if (!(containerElement instanceof Element)) {
    console.error('renderProjects: Invalid container element:', containerElement);
    return;
  }
  // Clear the containerElement
  containerElement.innerHTML = '';
 
 // Message if no projects
  if (project.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No projects to display yet - check back soon!';
    msg.classList.add('placeholder');
    containerElement.appendChild(msg);
    return;
  }

  // Make loop to create new <article> for each project
  project.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
    <h3>${project.title}</h3>
    <img src="${project.image}" alt="${project.title}">
    <p>${project.description}</p>
    `;
    containerElement.appendChild(article);
  })
}
// Challenge Questions
//  - Q1: What type of data should the project parameter contain?
//  - A1: An array of project objects
//
//  - Q2: How would you test if the containerElement is valid?
//  - A2: See above code for a check
//
// Think about it:
//  - Q1/2: Why is it important to clear the container before adding new elements?
//  - A1/2: Avoid duplicating old project when we want to update the list / add new projects
//
// Think about it:
//  - Q1/2: Why do we use createElement instead of directly appending the HTML?
//  - How does using createElement make your code more secure or modular?
//  - A 1/2: Because we are now ingesting information from an external JSON, we want the code to be
//  - flexible enough to support different ways we might want to decribe the projects. Also this prevents
//  - someone from putting malicious code into out website through the JSON.