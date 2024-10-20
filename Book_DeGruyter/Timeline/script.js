document.addEventListener('DOMContentLoaded', function() {
    // Load data from JSON file
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            console.log('Data loaded:', data); // Add this line
            initializeTimeline(data);
        })
        .catch(error => console.error('Error loading the JSON file:', error));
});

function initializeTimeline(data) {
    if (!data || data.length === 0) {
        console.error('No data available to render timeline');
        return;
    }

    const margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    console.log('SVG created');

    const parseDate = d3.timeParse("%Y-%m-%d");
    const x = d3.scaleTime().range([0, width]);

    data.forEach(d => {
        d.date = parseDate(d.date);
    });

    x.domain([new Date(1960, 0, 1), new Date(2024, 11, 31)]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height / 2 + ")")
        .call(xAxis);

    const eventGroup = svg.selectAll(".event-group")
        .data(data)
      .enter().append("g")
        .attr("class", d => `event-group ${d.country}`)
        .attr("transform", d => `translate(${x(d.date)}, ${height / 2})`);

    console.log('Event groups created:', eventGroup.size());

    eventGroup.append("line")
        .attr("class", "event-line")
        .attr("y1", 0)
        .attr("y2", d => d.country === "Togo" ? -20 : 20)
        .attr("stroke", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4")
        .attr("stroke-width", 2);

    eventGroup.append("circle")
        .attr("class", "event")
        .attr("r", 5)
        .attr("cy", d => d.country === "Togo" ? -20 : 20)
        .attr("fill", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4");

    eventGroup.append("title")
        .text(d => d.event);

    eventGroup
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.event)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    eventGroup
        .on("click", function(event, d) {
            detailsPanel.html(`
                <h3>${d.event}</h3>
                <p>Date: ${d3.timeFormat("%B %d, %Y")(d.date)}</p>
                <p>Country: ${d.country}</p>
                <p>Category: ${d.category}</p>
            `)
            .style("display", "block");
        });

    // Add a close button to the details panel
    detailsPanel.append("button")
        .text("Close")
        .on("click", function() {
            detailsPanel.style("display", "none");
        });

    adjustTextPosition();

    d3.select("#categorySelect").on("change", function() {
        const selectedCategory = this.value;

        const filteredData = selectedCategory === "all" ? data : data.filter(d => d.category === selectedCategory);

        const eventGroupUpdate = svg.selectAll(".event-group")
            .data(filteredData, d => d.event);

        eventGroupUpdate.exit().remove();

        const eventGroupEnter = eventGroupUpdate.enter().append("g")
            .attr("class", d => `event-group ${d.country}`)
            .attr("transform", d => `translate(${x(d.date)}, ${height / 2})`);

        eventGroupEnter.append("line")
            .attr("class", "event-line")
            .attr("y1", 0)
            .attr("y2", d => d.country === "Togo" ? -20 : 20)
            .attr("stroke", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4")
            .attr("stroke-width", 2);

        eventGroupEnter.append("circle")
            .attr("class", "event")
            .attr("r", 5)
            .attr("cy", d => d.country === "Togo" ? -20 : 20)
            .attr("fill", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4");

        eventGroupEnter.append("title")
            .text(d => d.event);

        eventGroupEnter
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d.event)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        eventGroupEnter.merge(eventGroupUpdate)
            .attr("transform", d => `translate(${x(d.date)}, ${height / 2})`);

        adjustTextPosition();
    });

    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "zoom")
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(zoom);

    function zoomed(event) {
        const newX = event.transform.rescaleX(x);

        svg.selectAll(".x.axis").call(xAxis.scale(newX));

        svg.selectAll(".event-group")
            .attr("transform", d => `translate(${newX(d.date)}, ${height / 2})`);
        
        adjustTextPosition();
    }

    function adjustTextPosition() {
        const texts = svg.selectAll(".event-label");

        texts.each(function(d, i) {
            const thisText = d3.select(this);
            const thisBBox = thisText.node().getBBox();
            let y = d.country === "Togo" ? -25 : 25;

            texts.each(function(d2, j) {
                if (i === j || d.country !== d2.country) return;
                const otherText = d3.select(this);
                const otherBBox = otherText.node().getBBox();

                if (isOverlapping(thisBBox, otherBBox)) {
                    if (d.country === "Togo") {
                        y -= 15;
                    } else {
                        y += 15;
                    }
                }
            });

            thisText.attr("y", y);
        });
    }

    function isOverlapping(bbox1, bbox2) {
        return !(
            bbox1.right < bbox2.left ||
            bbox1.left > bbox2.right ||
            bbox1.bottom < bbox2.top ||
            bbox1.top > bbox2.bottom
        );
    }
}
