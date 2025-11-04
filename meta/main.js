import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Read in csv file
//async function loadData() {
//  const data = await d3.csv('loc.csv');
//  console.log(data);
//  return data;
//}

//let data = await loadData();

// Row conversion function (from Lab 6 Step 1.1)
async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
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
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
        writable: true,
        configurable: true,
        enumerable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of unique files in the codebase
  const uniqueFiles = new Set(data.map(d => d.file)).size;
  dl.append('dt').text('Files in codebase');
  dl.append('dd').text(uniqueFiles);

  // Average line length (characters)
  const avgLength = d3.mean(data, d => d.length).toFixed(1);
  dl.append('dt').text('Average line length');
  dl.append('dd').text(`${avgLength} chars`);

  // Longest line length
  const maxLength = d3.max(data, d => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(`${maxLength} chars`);

  // Day-of-week
  const dayCounts = d3.rollup(
    commits,
    v => v.length,
    d => d.datetime.getDay() // 0 = Sunday
  );

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const topDayIndex = Array.from(dayCounts.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))[0][0];

  dl.append('dt').text('Most active day');
  dl.append('dd').text(days[topDayIndex]);


}

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);