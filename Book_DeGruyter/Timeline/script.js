document.addEventListener("DOMContentLoaded", function() {
  // Array of events with date, event description, and country
  const events = [
    { date: "1968-05-01", event: "Expulsion from the University of Dakar", country: "Senegal" },
    { date: "1969-05-01", event: "Dahomean May", country: "Benin" },
    // Add your other events here
  ];

  // Set the dimensions for the SVG
  const width = 800, height = events.length * 50 + 100;
  const margin = {top: 20, right: 20, bottom: 30, left: 100};

  // Create the SVG container
  const svg = d3.select("#timeline").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Create a scale for the y-axis
  const yScale = d3.scaleTime()
                   .domain(d3.extent(events, d => new Date(d.date)))
                   .range([0, height - margin.top - margin.bottom]);

  // Add the y-axis to the SVG
  svg.append("g")
     .call(d3.axisLeft(yScale));

  // Draw the vertical line for the timeline
  svg.append("line")
     .attr("x1", 0)
     .attr("y1", 0)
     .attr("x2", 0)
     .attr("y2", height - margin.top - margin.bottom)
     .attr("stroke", "black");

  // Tooltip for event details
  const tooltip = d3.select("body").append("div")
                    .attr("id", "tooltip")
                    .style("opacity", 0);

  // Function to update the timeline based on the selected country
  function updateTimeline(selectedCountry) {
    // Filter events based on the selected country
    const filteredEvents = selectedCountry === "All" ? events : events.filter(d => d.country === selectedCountry);

    // Bind the filtered events data to the circles
    const circles = svg.selectAll("circle")
                       .data(filteredEvents, d => d.date);

    // Enter new elements
    circles.enter().append("circle")
           .attr("cx", 0)
           .attr("cy", d => yScale(new Date(d.date)))
           .attr("r", 5)
           .attr("fill", "blue")
           .on("mouseover", function(e, d) {
             tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
             tooltip.html(d.event + "<br/>" + d.date)
                    .style("left", (e.pageX) + "px")
                    .style("top", (e.pageY - 28) + "px");
           })
           .on("mouseout", function() {
             tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
           });

    // Exit and remove old elements
    circles.exit().remove();

    // Update all existing elements
    circles.attr("cy", d => yScale(new Date(d.date)));
  }

  // Event listener for the country filter dropdown
  d3.select("#countryFilter").on("change", function(event) {
    updateTimeline(this.value);
  });

  // Initial rendering of the timeline
  updateTimeline("All");
});
