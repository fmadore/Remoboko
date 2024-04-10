document.addEventListener("DOMContentLoaded", function() {
const events = [
  { date: "1968-05-01", event: "Expulsion of Beninese and Togolese students from the University of Dakar" },
  { date: "1969-05-01", event: "Dahomean May" },
  { date: "1970-08-21", event: "Creation of the Université du Dahomey in Abomey-Calavi" },
  // Add the rest of your events here
];

  const svg = d3.select("#timeline").append("svg")
                .attr("width", 1000)
                .attr("height", 600);

  // Scale for the dates
  const xScale = d3.scaleTime()
                   .domain([new Date(events[0].date), new Date(events[events.length - 1].date)])
                   .range([20, 980]);

  // Draw the timeline
  svg.append("line")
     .attr("x1", 20)
     .attr("y1", 50)
     .attr("x2", 980)
     .attr("y2", 50)
     .attr("class", "line");

  // Place events
  events.forEach(event => {
    svg.append("circle")
       .attr("cx", xScale(new Date(event.date)))
       .attr("cy", 50)
       .attr("r", 5)
       .attr("class", "event");

    svg.append("text")
       .attr("x", xScale(new Date(event.date)))
       .attr("y", 80)
       .text(event.event)
       .attr("text-anchor", "middle");
  });
});
