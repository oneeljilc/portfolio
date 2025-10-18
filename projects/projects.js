import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// Lab 4 Step 1.3 "Check Your Understanding"
//
//  - Q1: What happens if the projects.json file is missing or incorrectly formatted?
//  - A1: The error is displayed: "Error fetching or parsing JSON data:"
//
//  - Q2: How does the renderProjects function handle an empty array of projects?
//  - A2: Nothing will be displayed on the Projects page. Also no error message.
//      See updated global.js file for a placeholder message