document.addEventListener("DOMContentLoaded", function() {
  // Array of events with date, event description, and country
  const events = [
    {"country": "Togo", "event": "Independance of Togo", "date": "1960-04-27"},
    {"country": "Benin", "event": "Independance of Benin", "date": "1960-08-01"},
    {"country": "Togo", "event": "Coup d'Etat Togo", "date": "1963-01-13"},
    {"country": "Benin-Togo", "event": "Creation of the Institut d’Enseignement Supérieur du Bénin (IESB)", "date": "1965-07-14"},
    {"country": "Togo", "event": "Gnassingbé Eyadéma comes to power", "date": "1967-04-15"},
    {"country": "Benin-Togo", "event": "Expulsion of Beninese and Togolese students from the University of Dakar", "date": "1968-05-01"},
    {"country": "Benin", "event": "Dahomean May", "date": "1969-05-01"},
    {"country": "Benin", "event": "Creation of the Université du Dahomey in Abomey-Calavi", "date": "1970-08-21"},
    {"country": "Togo", "event": "Creation of the Université du Bénin (UB) in Lomé", "date": "1970-09-14"},
    {"country": "Benin", "event": "Creation of the Emmaüs Community at the Université du Dahomey", "date": "1972-01-01"},
    {"country": "Togo", "event": "Dissolution of all youth associations except for the JRPT", "date": "1972-02-12"},
    {"country": "Benin", "event": "Mathieu Kérékou comes to power", "date": "1972-10-26"},
    {"country": "Togo", "event": "Official inauguration of the UB", "date": "1973-11-29"},
    {"country": "Togo", "event": "Creation of a Bible study group at the UB", "date": "1974-09-01"},
    {"country": "Benin", "event": "Adoption of Marxism-Leninism as the state ideology", "date": "1974-11-30"},
    {"country": "Benin", "event": "École Nouvelle reform", "date": "1975-06-01"},
    {"country": "Togo", "event": "École Nouvelle reform", "date": "1975-05-06"},
    {"country": "Benin", "event": "University of Dahomey renamed to Université Nationale du Bénin (UNB)", "date": "1975-11-30"},
    {"country": "Togo", "event": "Creation of the Mouvement National des Étudiants et Stagiaires Togolais (MONESTO)", "date": "1977-08-01"},
    {"country": "Benin", "event": "Creation of the Groupe Biblique des Élèves et Étudiants du Bénin (GBEEB)", "date": "1977-12-01"},
    {"country": "Benin", "event": "Official recognition of the Communauté Islamique Universitaire du Bénin (CIUB)", "date": "1979-01-01"},
    {"country": "Togo", "event": "Ban of religious sects in Togo", "date": "1979-02-27"},
    {"country": "Benin", "event": "Laying of the foundation stone of the Institut de la Langue Arabe et de la Culture Islamique (ILACI)", "date": "1979-10-06"},
    {"country": "Togo", "event": "Creation of the JEC-Universitaire (JEC-U) at the UB", "date": "1981-01-01"},
    {"country": "Togo", "event": "Official recognition of the Groupes Bibliques Universitaires et Scolaires du Togo (GBUST)", "date": "1987-01-01"},
    {"country": "Togo", "event": "8th Triennial Congress of the GBUAF in Lomé", "date": "1988-08-02"},
    {"country": "Benin", "event": "National Conference", "date": "1990-02-19"},
    {"country": "Togo", "event": "National Conference", "date": "1991-07-08"},
    {"country": "Togo", "event": "Construction of the Centre Catholique Universitaire (CCU)", "date": "1996-01-01"},
    {"country": "Togo", "event": "Creation of the Réseau des Anciens Jécistes in Togo", "date": "1998-01-01"},
    {"country": "Benin", "event": "Creation of the Amicale des Intellectuels Musulmans du Bénin (AIMB)", "date": "1999-01-01"},
    {"country": "Togo", "event": "Creation of the Université de Kara", "date": "1999-01-21"},
    {"country": "Benin", "event": "UNB renamed Université d'Abomey-Calavi", "date": "2001-01-01"},
    {"country": "Togo", "event": "UB renamed University of Lomé", "date": "2001-03-09"},
    {"country": "Benin", "event": "Creation of the Université de Parakou", "date": "2001-09-18"},
    {"country": "Togo", "event": "Death of President Eyadéma", "date": "2005-02-05"},
    {"country": "Benin", "event": "Creation of the Réseau des Anciens de la Jeunesse Étudiante Catholique du Bénin (RAJEC)", "date": "2005-08-01"},
    {"country": "Togo", "event": "Creation of the Association des Cadres Musulmans au Togo (ACMT)", "date": "2006-08-01"},
    {"country": "Togo", "event": "Implementation of the LMD reform", "date": "2008-07-21"},
    {"country": "Benin", "event": "Implementation of the LMD reform", "date": "2010-06-11"},
  ];

  const width = 800, height = events.length * 50 + 100;
  const margin = {top: 20, right: 20, bottom: 30, left: 100};

  const svg = d3.select("#timeline").append("svg")
    .attr("width", width)
    .attr("height", height);

  const zoomableGroup = svg.append("g")
    .attr("class", "zoomable");

  const zoom = d3.zoom()
    .scaleExtent([1, 10]) // Adjust these values as needed for your zoom levels
    .on("zoom", (event) => {
      zoomableGroup.attr("transform", event.transform);
    });

  svg.call(zoom) // Apply the zoom behavior to the SVG element
    .on("dblclick.zoom", null); // Optional: disable double-click to zoom

  // Define scales and axes outside of the zoomable group
  const yScale = d3.scaleTime()
    .domain(d3.extent(events, d => new Date(d.date)))
    .range([margin.top, height - margin.bottom]);

  const yAxis = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // Draw the vertical line for the timeline
  zoomableGroup.append("line")
    .attr("x1", margin.left)
    .attr("y1", margin.top)
    .attr("x2", margin.left)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "black");

  // Tooltip setup
  const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  // Function to update the timeline based on the selected country
  function updateTimeline(selectedCountry) {
    const filteredEvents = selectedCountry === "All" ? events : events.filter(d => d.country === selectedCountry);

    // Setup for circles (events)
    const circles = zoomableGroup.selectAll("circle")
      .data(filteredEvents, d => d.date);

    circles.enter().append("circle")
      .attr("cx", margin.left)
      .attr("cy", d => yScale(new Date(d.date)))
      .attr("r", 5)
      .attr("fill", "blue")
      .on("mouseover", function(e, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`${d.event}<br/>${d.date}`)
          .style("left", (e.pageX + 5) + "px")
          .style("top", (e.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    circles.exit().remove();
  }

  // Dropdown event listener
  d3.select("#countryFilter").on("change", function() {
    updateTimeline(this.value);
  });

  // Initial rendering
  updateTimeline("All");
});
