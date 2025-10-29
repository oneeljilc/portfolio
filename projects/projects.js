import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

document.addEventListener('DOMContentLoaded', async () => {
  const projectsContainer = document.querySelector('.projects');
  const projectsTitle = document.querySelector('.projects-title');
  const searchInput = document.querySelector('.searchBar');
  const svg = d3.select('svg');
  const legend = d3.select('.legend');
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Load project data
  const projects = await fetchJSON('../lib/projects.json');

  // Render all projects initially
  renderProjects(projects, projectsContainer, 'h3');

  // Update the project count
  if (Array.isArray(projects)) {
    projectsTitle.textContent = `${projects.length} Projects`;
  } else {
    projectsTitle.textContent = '0 Projects';
  }

  // --- Pie chart rendering function ---
  function renderPieChart(projectsGiven) {
    // Clear old chart + legend
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();

    // Compute rolled data
    const rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year
    );

    // Convert to array of objects
    const data = rolledData.map(([year, count]) => ({
      value: count,
      label: year,
    }));

    // Generate slices
    const sliceGenerator = d3.pie().value((d) => d.value);
    const arcData = sliceGenerator(data);

    // Draw arcs
    arcData.forEach((d, idx) => {
      svg
        .append('path')
        .attr('d', arcGenerator(d))
        .attr('fill', colors(idx));
    });

    // Draw legend
    data.forEach((d, idx) => {
      legend
        .append('li')
        .attr('class', 'legend-item')
        .attr('style', `--color:${colors(idx)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
  }

  // Draw full pie chart initially
  renderPieChart(projects);

  // --- Search bar filtering ---
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();

    // Filter projects based on search term
    const filteredProjects = projects.filter((project) => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query);
    });

    // Re-render project list
    renderProjects(filteredProjects, projectsContainer, 'h2');

    // Update chart
    renderPieChart(filteredProjects);
  });
});

// Lab 5 Step 5.2
let selectedIndex = -1;

let svg = d3.select('svg');
svg.selectAll('path').remove();
arcs.forEach((arc, i) => {
  svg
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(i))
    .on('click', () => {
      // What should we do? (Keep scrolling to find out!)
    });
});
