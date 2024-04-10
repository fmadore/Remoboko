document.addEventListener("DOMContentLoaded", function() {
const events = [
  { date: "1968-05-01", event: "Expulsion of Beninese and Togolese students from the University of Dakar" },
  { date: "1969-05-01", event: "Dahomean May" },
  { date: "1970-08-21", event: "Creation of the Université du Dahomey in Abomey-Calavi" },
  // Add the rest of your events here
];

  const svg = d3.select("#timeline").append("svg")
                .attr("width", 600)
                .attr("height", events.length * 50 + 100);

  // Scale for the dates
  const yScale = d3.scaleTime()
                   .domain([new Date(events[0].date), new Date(events[events.length - 1].date)])
                   .range([50, events.length * 50]);

  // Add the Y Axis
  const yAxis = d3.axisLeft(yScale)
                  .ticks(d3.timeYear.every(1))
                  .tickFormat(d3.timeFormat('%Y'));

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

  // Place events and add interactivity for tooltip
  events.forEach(event => {
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
       .attr("text-anchor", "start")
       .attr("alignment-baseline", "central");
  });
});
