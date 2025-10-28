import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

document.addEventListener('DOMContentLoaded', async () => {
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    const projects = await fetchJSON('../lib/projects.json');
    renderProjects(projects, projectsContainer, 'h3');

    if (Array.isArray(projects)) {
        const count = projects.length;
        projectsTitle.textContent = `${count} Projects`;
    } else {
        projectsTitle.textContent = '0 Projects';
    }
});

// Lab 5 Step 1.3
//let arc = d3.arc().innerRadius(0).outerRadius(50)({
//  startAngle: 0,
//  endAngle: 2 * Math.PI,
//});
//d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');

//Lab 5 Step 1.4
//let data = [1, 2];
//let total = 0;
//for (let d of data) {
//  total += d;
//}
//let angle = 0;
//let arcData = [];
//for (let d of data) {
//  let endAngle = angle + (d / total) * 2 * Math.PI;
//  arcData.push({ startAngle: angle, endAngle });
//  angle = endAngle;
//}
//let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
//let arcs = arcData.map((d) => arcGenerator(d));
//let colors = ['gold', 'purple'];
//arcs.forEach((arc, idx) => {
//  d3.select('svg')
//  .append('path')
//  .attr('d', arc)
//  .attr('fill', colors[idx])
//});

// Lab 5 Step 1.4 & 1.5 & 2.1
//let data = [1, 2];
//let data = [1, 2, 3, 4, 5, 5];
let data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];
//let sliceGenerator = d3.pie();
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arcs = arcData.map((d) => arcGenerator(d));
//let colors = ['gold', 'purple'];
let colors = d3.scaleOrdinal(d3.schemeTableau10);
arcs.forEach((arc, idx) => {
  d3.select('svg')
  .append('path')
  .attr('d', arc)
  .attr('fill', colors(idx))
});

// Legend Lab 5 Step 2.2
let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('class', 'legend-item')
    .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});
