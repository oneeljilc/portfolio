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

let arc = d3.arc().innerRadius(0).outerRadius(50)({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});

d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');

// Lab 4 Step 1.3 "Check Your Understanding"
//
//  - Q1: What happens if the projects.json file is missing or incorrectly formatted?
//  - A1: The error is displayed: "Error fetching or parsing JSON data:"
//
//  - Q2: How does the renderProjects function handle an empty array of projects?
//  - A2: Nothing will be displayed on the Projects page. Also no error message.
//      See updated global.js file for a placeholder message