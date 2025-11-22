import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

/* ---------------------------------------------------------
   GLOBAL VARIABLES
--------------------------------------------------------- */
let xScale;
let yScale;
let commits = [];
let filteredCommits = [];

/* ---------------------------------------------------------
   LOAD DATA
--------------------------------------------------------- */
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

/* ---------------------------------------------------------
   PROCESS COMMITS
--------------------------------------------------------- */
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];

      return {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author: first.author,
        date: first.date,
        time: first.time,
        timezone: first.timezone,
        datetime: first.datetime,
        hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
        totalLines: lines.length,
        lines,
      };
    })
    .sort((a, b) => a.datetime - b.datetime); // IMPORTANT for Scrollama
}

/* ---------------------------------------------------------
   SUMMARY STATS
--------------------------------------------------------- */
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const uniqueFiles = new Set(data.map((d) => d.file)).size;
  dl.append('dt').text('Files in codebase');
  dl.append('dd').text(uniqueFiles);

  const avgLength = d3.mean(data, (d) => d.length).toFixed(1);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(`${avgLength} chars`);

  const maxLength = d3.max(data, (d) => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(`${maxLength} chars`);

  const dayCounts = d3.rollup(
    commits,
    (v) => v.length,
    (d) => d.datetime.getDay()
  );
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const topDayIndex = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  dl.append('dt').text('Most active day');
  dl.append('dd').text(days[topDayIndex]);
}

/* ---------------------------------------------------------
   BRUSH HELPERS
--------------------------------------------------------- */
function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d)
  );
}

/* ---------------------------------------------------------
   TOOLTIP
--------------------------------------------------------- */
function renderTooltipContent(commit) {
  if (!commit) return;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-link').href = commit.url;

  document.getElementById('commit-date').textContent =
    commit.datetime.toLocaleDateString('en', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  document.getElementById('tooltip-commit-time').textContent =
    commit.datetime.toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit',
    });

  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

/* ---------------------------------------------------------
   SCATTER PLOT (INITIAL RENDER)
--------------------------------------------------------- */
function renderScatterPlot(data, commitsData) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`);

  xScale = d3.scaleTime()
    .domain(d3.extent(commitsData, (d) => d.datetime))
    .range([usable.left, usable.right]);

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d}:00`);

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(yAxis);

  const dots = svg.append('g').attr('class', 'dots');

  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commitsData, (d) => d.totalLines))
    .range([2, 30]);

  dots.selectAll('circle')
    .data(commitsData, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.selectAll('circle').style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  const brush = d3.brush().on('start brush end', brushed);
  svg.call(brush);
}

/* ---------------------------------------------------------
   UPDATE SCATTER PLOT
--------------------------------------------------------- */
function updateScatterPlot(data, commitsData) {
  const svg = d3.select('#chart svg');
  if (svg.empty()) return;

  xScale.domain(d3.extent(commitsData, (d) => d.datetime));

  svg.select('.x-axis').call(d3.axisBottom(xScale));

  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commitsData, (d) => d.totalLines))
    .range([2, 30]);

  svg.select('.dots')
    .selectAll('circle')
    .data(commitsData, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue');
}

/* ---------------------------------------------------------
   FILE VISUALIZATION (UNIT DOTS)
--------------------------------------------------------- */
function updateFiles(filteredCommits) {
  const lines = filteredCommits.flatMap((d) => d.lines);

  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      })
    );

  filesContainer.select('dt > code').text((d) => d.name);

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

/* ---------------------------------------------------------
   SLIDER → UPDATE EVERYTHING
--------------------------------------------------------- */
let timeScale;
let commitMaxTime;

function onTimeSliderChange() {
  const progress = Number(document.getElementById('commit-progress').value);
  commitMaxTime = timeScale.invert(progress);

  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  updateFiles(filteredCommits);
}

/* ---------------------------------------------------------
   SCROLLAMA
--------------------------------------------------------- */
function updateVisualsToDatetime(targetTime) {
  filteredCommits = commits.filter((d) => d.datetime <= targetTime);

  updateScatterPlot(data, filteredCommits);
  updateFiles(filteredCommits);

  document.getElementById('commit-time').textContent =
    targetTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
}

function onStepEnter(response) {
  const commit = response.element.__data__;
  updateVisualsToDatetime(commit.datetime);
}

const scroller = scrollama();

/* ---------------------------------------------------------
   MAIN
--------------------------------------------------------- */
const data = await loadData();
commits = processCommits(data);
filteredCommits = commits;

// Time scale
timeScale = d3.scaleTime()
  .domain([d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)])
  .range([0, 100]);

commitMaxTime = timeScale.invert(100);

// Build story steps
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html((d, i) => `
    <p>On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })}, I made 
    <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit'
    }</a>.
    It edited ${d.totalLines} lines across ${
      d3.rollups(d.lines, (D) => D.length, (d) => d.file).length
    } files.</p>
  `);

// Render initial UI
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
updateFiles(commits);

// Attach slider
document.getElementById('commit-progress')
  .addEventListener('input', onTimeSliderChange);

onTimeSliderChange();

// Initialize Scrollama
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.5,
  })
  .onStepEnter(onStepEnter);







