console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

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
]

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    let a = document.createElement('a'); // Step 3.2
    a.href = url;
    a.textContent = title;
    nav.append(a);
}

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/portfolio/'; // GitHub Pages repo name

url = !url.startsWith('http') ? BASE_PATH + url : url
