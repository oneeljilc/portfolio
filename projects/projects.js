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

let projects = await fetchJSON('../lib/projects.json'); // fetch your project data
let query = '';
let searchInput = document.querySelector('.searchBar');
let svg = d3.select('svg');
let legend = d3.select('.legend');
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function renderPieChart(projectsGiven) {
  // Clear existing chart & legend before redrawing
  svg.selectAll('*').remove()
  legend.selectAll('*').remove()

  // Compute rolled data
  let rolledData = d3.rollups(
    projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
  
  // Recalculate data
  let data = rolledData.map(([year, count]) => {
      return { value: count, label: year };
    });

  // Recalculate slice generator, arc data, arc, etc.
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));
    arcs.forEach((arc, idx) => {
     d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
    });
  
  // Update legend
  data.forEach((d, idx) => {
      legend
        .append('li')
        .attr('class', 'legend-item')
        .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
}

renderPieChart(projects);

searchInput.addEventListener('input', (event) => {
    // update query value
    query = event.target.value.toLowerCase();
    // TODO: filter the projects
  let filteredProjects = setQuery(event.target.value);
  // re-render legends and pie chart when event triggers
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});