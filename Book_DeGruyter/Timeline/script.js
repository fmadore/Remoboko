document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
    d3.json('data.json').then(data => {
        console.log('Data loaded:', data);
        createTimeline(data);
    }).catch(error => console.error('Error loading the JSON file:', error));
});

function createTimeline(data) {
    console.log('Creating timeline with data:', data);
    const margin = {top: 50, right: 50, bottom: 50, left: 50};
    const width = 960 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#timeline")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "#f0f0f0")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    console.log('SVG created');

    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(d => d.date = parseDate(d.date));

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const xAxis = d3.axisBottom(x);
    svg.append("g")
        .attr("transform", `translate(0,${height/2})`)
        .call(xAxis);

    console.log('Axis added');

    const eventGroups = svg.selectAll(".event")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "event")
        .attr("transform", d => `translate(${x(d.date)},${height/2})`);

    eventGroups.append("line")
        .attr("class", "event-line")
        .attr("y1", -10)
        .attr("y2", 10)
        .attr("stroke", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4");

    eventGroups.append("circle")
        .attr("class", "event-circle")
        .attr("fill", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4");

    eventGroups.append("text")
        .attr("class", "event-text")
        .attr("y", d => d.country === "Togo" ? -15 : 20)
        .attr("text-anchor", "middle")
        .text(d => d.event)
        .call(wrap, 100);

    console.log('Timeline created');
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
