import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Row conversion function (from Lab 6 Step 1.1)
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
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
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

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const uniqueFiles = new Set(data.map(d => d.file)).size;
  dl.append('dt').text('Files in codebase');
  dl.append('dd').text(uniqueFiles);

  const avgLength = d3.mean(data, d => d.length).toFixed(1);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(`${avgLength} chars`);

  const maxLength = d3.max(data, d => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(`${maxLength} chars`);

  const dayCounts = d3.rollup(
    commits,
    v => v.length,
    d => d.datetime.getDay()
  );

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const topDayIndex = Array.from(dayCounts.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))[0][0];

  dl.append('dt').text('Most active day');
  dl.append('dd').text(days[topDayIndex]);
}

// --- Scatter plot ---
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const usableArea = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right]);

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d) => `${String(d % 24).padStart(2, '0')}:00`);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );

  // --- Dots group ---
  const dots = svg.append('g').attr('class', 'dots');

  // Radius scale (still sqrt for perceptual accuracy)
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // ✅ Step 4.3: Sort commits so larger dots render first
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits)
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
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
}


function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
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

// Put tooltip by cursor
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// --- Main execution (moved to bottom) ---
const data = await loadData();
const commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
