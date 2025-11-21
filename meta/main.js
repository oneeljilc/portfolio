import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// -----------------------------------------------------------------------------
// Global variables
// -----------------------------------------------------------------------------
let xScale;
let yScale;
let commits = []; // accessible across brush functions

// -----------------------------------------------------------------------------
// Data loading and processing
// -----------------------------------------------------------------------------
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;
      const ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      return ret;
    });
}

// -----------------------------------------------------------------------------
// Stats summary
// -----------------------------------------------------------------------------
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

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

  const dayCounts = d3.rollup(commits, (v) => v.length, (d) => d.datetime.getDay());
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const topDayIndex = Array.from(dayCounts.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))[0][0];

  dl.append('dt').text('Most active day');
  dl.append('dd').text(days[topDayIndex]);
}

// -----------------------------------------------------------------------------
// Brushing helpers
// -----------------------------------------------------------------------------
function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countEl = document.querySelector('#selection-count');
  countEl.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function createBrushSelector(svg) {
  const brush = d3.brush().on('start brush end', brushed);
  svg.call(brush);
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// -----------------------------------------------------------------------------
// Tooltip helpers
// -----------------------------------------------------------------------------
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('tooltip-commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');
  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleDateString('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  time.textContent = commit.datetime?.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// -----------------------------------------------------------------------------
// Scatter plot
// -----------------------------------------------------------------------------
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

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`);

  // Scales
  xScale = d3.scaleTime()
    .domain(d3.extent(commitsData, (d) => d.datetime))
    .range([usable.left, usable.right]);

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usable.bottom, usable.top]);

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d) => `${String(d % 24).padStart(2, '0')}:00`);

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usable.width)
    );

  // Dots
  const dots = svg.append('g').attr('class', 'dots');
  const [minLines, maxLines] = d3.extent(commitsData, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  const sortedCommits = d3.sort(commitsData, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.selectAll('circle').style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Axes with class names (important for updating later)
  svg.append('g')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usable.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  // Brush
  createBrushSelector(svg);
}

function updateScatterPlot(data, commitsData) {
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

  const svg = d3.select('#chart').select('svg');
  if (svg.empty()) return; // safeguard

  // Update scales
  xScale.domain(d3.extent(commitsData, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commitsData, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // Update axis in place
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(xAxis);

  // Update dots
  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commitsData, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.selectAll('circle').style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

 // Lab 6 Step 5.6
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

// -----------------------------------------------------------------------------
// Main execution
// -----------------------------------------------------------------------------
const data = await loadData();
commits = processCommits(data);

// ---------------------------------------------
// Time filter setup
// ---------------------------------------------
let commitProgress = 100;

let timeScale = d3.scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

// Will get updated as user moves slider
let filteredCommits = commits;

function onTimeSliderChange() {
  commitProgress = Number(document.getElementById("commit-progress").value);
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById("commit-time").textContent =
    commitMaxTime.toLocaleString("en", {
      dateStyle: "long",
      timeStyle: "short",
    });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
}

// ---------------------------------------------
// Render everything ONCE, THEN enable slider
// -----------------------------------------------------------------------------
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

// Attach slider after scatter plot exists
document
  .getElementById("commit-progress")
  .addEventListener("input", onTimeSliderChange);

// Initialize time display & filtered view
onTimeSliderChange();





