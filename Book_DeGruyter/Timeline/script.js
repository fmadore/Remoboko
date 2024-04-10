document.addEventListener("DOMContentLoaded", function() {
const events = [
  { date: "1968-05-01", event: "Expulsion of Beninese and Togolese students from the University of Dakar", country: "Senegal" },
  { date: "1969-05-01", event: "Dahomean May", country: "Benin" },
  // ... other events
];

  const svg = d3.select("#timeline").append("svg")
                .attr("width", 600)
                .attr("height", events.length * 50 + 100);

  // Define the scales and axis
  const yScale = d3.scaleTime()
                   .domain([new Date(events[0].date), new Date(events[events.length - 1].date)])
                   .range([50, events.length * 50]);

  const yAxis = d3.axisLeft(yScale)
                  .ticks(d3.timeYear.every(1))
                  .tickFormat(d3.timeFormat('%Y'));

  // Append the axis
  svg.append("g")
     .attr("transform", "translate(100,0)")
     .call(yAxis);

  // Draw the timeline
  svg.append("line")
     .attr("x1", 100)
     .attr("y1", 50)
     .attr("x2", 100)
     .attr("y2", events.length * 50)
     .attr("class", "line");

  // Tooltip div
  const tooltip = d3.select("#tooltip");

  // Dropdown filter
  const countryFilter = d3.select("#countryFilter")
                          .on("change", function() {
                            const selectedCountry = this.value;
                            updateTimeline(selectedCountry);
                          });

  function updateTimeline(selectedCountry) {
    const filteredEvents = selectedCountry === "All" ? events : events.filter(d => d.country === selectedCountry);
    
    // Clear the current events
    svg.selectAll(".event").remove();
    svg.selectAll(".event-text").remove();
    
    // Place filtered events
    filteredEvents.forEach(event => {
      const yPosition = yScale(new Date(event.date));
      
      svg.append("circle")
         .attr("cx", 100)
         .attr("cy", yPosition)
         .attr("r", 5)
         .attr("class", "event")
         .on("mouseover", function(e) {
           tooltip.transition()
                  .duration(200)
                  .style("opacity", .9);
           tooltip.html(event.event + "<br/>" + event.date)
                  .style("left", (e.pageX + 5) + "px")
                  .style("top", (e.pageY - 28) + "px");
         })
         .on("mouseout", function() {
           tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
         });
      
      svg.append("text")
         .attr("x", 120)
         .attr("y", yPosition)
         .text(event.event)
         .attr("class", "event-text")
         .attr("text-anchor", "start")
         .attr("alignment-baseline", "central");
    });
  }

  // Initial update
  updateTimeline("All");
});
