// Interactive D3 timeline for the Book_DeGruyter events (data.json).
// Benin events are drawn above the axis, Togo events below, with labels
// staggered in lanes to reduce overlaps.

const COUNTRY_COLORS = {
    'Benin': '#3388ff',
    'Togo': '#2ecc71'
};

document.addEventListener('DOMContentLoaded', function() {
    d3.json('data.json')
        .then(data => createTimeline(data))
        .catch(error => console.error('Error loading the JSON file:', error));
});

function createTimeline(data) {
    const margin = {top: 60, right: 40, bottom: 60, left: 40};
    const width = 1200 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    // Responsive SVG: viewBox scales with the container width
    const svg = d3.select("#timeline")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(d => d.date = parseDate(d.date));
    data.sort((a, b) => a.date - b.date);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .nice()
        .range([0, width]);

    const axisY = height / 2;

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${axisY})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)));

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "timeline-tooltip");

    const formatDate = d3.timeFormat("%-d %B %Y");

    // Stagger labels in lanes to reduce overlaps: each new label goes to the
    // first lane on its side whose previous label is far enough to the left.
    const laneStep = 62;
    const laneBase = 40;
    const laneCount = 4;
    const minLabelGap = 135;  // px between label centers sharing a lane
    const laneLastX = {
        'Benin': new Array(laneCount).fill(-Infinity),
        'Togo': new Array(laneCount).fill(-Infinity)
    };

    function assignLane(country, xPos) {
        const lanes = laneLastX[country];
        let lane = lanes.findIndex(lastX => xPos - lastX >= minLabelGap);
        if (lane === -1) {
            // All lanes crowded: use the one with the most room
            lane = lanes.indexOf(Math.min(...lanes));
        }
        lanes[lane] = xPos;
        return lane;
    }

    const eventGroups = svg.selectAll(".event")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "event")
        .attr("transform", d => `translate(${x(d.date)},${axisY})`);

    eventGroups.each(function(d) {
        const g = d3.select(this);
        const side = d.country === 'Benin' ? -1 : 1;   // Benin above, Togo below
        const lane = assignLane(d.country, x(d.date));
        const labelY = side * (laneBase + lane * laneStep);
        const color = COUNTRY_COLORS[d.country] || '#888';

        g.append("line")
            .attr("class", "event-line")
            .attr("y1", 0)
            .attr("y2", labelY)
            .attr("stroke", color);

        g.append("circle")
            .attr("class", "event-circle")
            .attr("r", 4.5)
            .attr("fill", color);

        const label = g.append("text")
            .attr("class", "event-text")
            .attr("y", labelY + (side < 0 ? -8 : 14))
            .attr("text-anchor", "middle")
            .text(d.event)
            .call(wrap, 100);

        // Hover interactions
        g.on("mouseenter", function(event) {
                g.select(".event-circle").attr("r", 7);
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.event}</strong><br>${formatDate(d.date)} &middot; ${d.country}<br><em>${d.category}</em>`);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY - 12) + "px");
            })
            .on("mouseleave", function() {
                g.select(".event-circle").attr("r", 4.5);
                tooltip.style("opacity", 0);
            });
    });

    // Legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(0,${-margin.top + 20})`);

    Object.entries(COUNTRY_COLORS).forEach(([country, color], i) => {
        const item = legend.append("g").attr("transform", `translate(${i * 110},0)`);
        item.append("circle").attr("r", 6).attr("fill", color);
        item.append("text")
            .attr("x", 12)
            .attr("y", 4)
            .attr("class", "legend-label")
            .text(country);
    });
}

function wrap(text, width) {
    text.each(function() {
        let text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1,
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy") || 0),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
