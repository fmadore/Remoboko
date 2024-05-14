document.addEventListener('DOMContentLoaded', function() {
    const data = [
        {"country": "Togo", "event": "Independance of Togo", "date": "1960-04-27", "category": "Politics"},
        {"country": "Benin", "event": "Independance of Benin", "date": "1960-08-01", "category": "Politics"},
        {"country": "Togo", "event": "Coup d'Etat Togo", "date": "1963-01-13", "category": "Politics"},
        {"country": "Togo", "event": "Gnassingbé Eyadéma comes to power", "date": "1967-04-15", "category": "Politics"},
        {"country": "Benin", "event": "Dahomean May", "date": "1969-05-01", "category": "Politics"},
        {"country": "Benin", "event": "Creation of the Université du Dahomey in Abomey-Calavi", "date": "1970-08-21", "category": "Education"},
        {"country": "Togo", "event": "Creation of the Université du Bénin (UB) in Lomé", "date": "1970-09-14", "category": "Education"},
        {"country": "Benin", "event": "Creation of the Emmaüs Community at the Université du Dahomey", "date": "1972-01-01", "category": "Religion"},
        {"country": "Togo", "event": "Dissolution of all youth associations except for the JRPT", "date": "1972-02-12", "category": "Politics"},
        {"country": "Benin", "event": "Mathieu Kérékou comes to power", "date": "1972-10-26", "category": "Politics"},
        {"country": "Togo", "event": "Official inauguration of the UB", "date": "1973-11-29", "category": "Education"},
        {"country": "Togo", "event": "Creation of a Bible study group at the UB", "date": "1974-09-01", "category": "Religion"},
        {"country": "Benin", "event": "Adoption of Marxism-Leninism as the state ideology", "date": "1974-11-30", "category": "Politics"},
        {"country": "Benin", "event": "École Nouvelle reform", "date": "1975-06-01", "category": "Education"},
        {"country": "Togo", "event": "École Nouvelle reform", "date": "1975-05-06", "category": "Education"},
        {"country": "Benin", "event": "University of Dahomey renamed to Université Nationale du Bénin (UNB)", "date": "1975-11-30", "category": "Education"},
        {"country": "Togo", "event": "Creation of the Mouvement National des Étudiants et Stagiaires Togolais (MONESTO)", "date": "1977-08-01", "category": "Politics"},
        {"country": "Benin", "event": "Creation of the Groupe Biblique des Élèves et Étudiants du Bénin (GBEEB)", "date": "1977-12-01", "category": "Religion"},
        {"country": "Benin", "event": "Official recognition of the Communauté Islamique Universitaire du Bénin (CIUB)", "date": "1979-01-01", "category": "Religion"},
        {"country": "Togo", "event": "Ban of religious sects in Togo", "date": "1979-02-27", "category": "Religion"},
        {"country": "Benin", "event": "Laying of the foundation stone of the Institut de la Langue Arabe et de la Culture Islamique (ILACI)", "date": "1979-10-06", "category": "Religion"},
        {"country": "Togo", "event": "Creation of the JEC-Universitaire (JEC-U) at the UB", "date": "1981-01-01", "category": "Religion"},
        {"country": "Togo", "event": "Official recognition of the Groupes Bibliques Universitaires et Scolaires du Togo (GBUST)", "date": "1987-01-01", "category": "Religion"},
        {"country": "Togo", "event": "8th Triennial Congress of the GBUAF in Lomé", "date": "1988-08-02", "category": "Religion"},
        {"country": "Benin", "event": "National Conference", "date": "1990-02-19", "category": "Politics"},
        {"country": "Togo", "event": "National Conference", "date": "1991-07-08", "category": "Politics"},
        {"country": "Togo", "event": "Construction of the Centre Catholique Universitaire (CCU)", "date": "1996-01-01", "category": "Religion"},
        {"country": "Togo", "event": "Creation of the Réseau des Anciens Jécistes in Togo", "date": "1998-01-01", "category": "Religion"},
        {"country": "Benin", "event": "Creation of the Amicale des Intellectuels Musulmans du Bénin (AIMB)", "date": "1999-01-01", "category": "Religion"},
        {"country": "Togo", "event": "Creation of the Université de Kara", "date": "1999-01-21", "category": "Education"},
        {"country": "Benin", "event": "UNB renamed Université d'Abomey-Calavi", "date": "2001-01-01", "category": "Education"},
        {"country": "Togo", "event": "UB renamed University of Lomé", "date": "2001-03-09", "category": "Education"},
        {"country": "Benin", "event": "Creation of the Université de Parakou", "date": "2001-09-18", "category": "Education"},
        {"country": "Togo", "event": "Death of President Eyadéma", "date": "2005-02-05", "category": "Politics"},
        {"country": "Benin", "event": "Creation of the Réseau des Anciens de la Jeunesse Étudiante Catholique du Bénin (RAJEC)", "date": "2005-08-01", "category": "Religion"},
        {"country": "Togo", "event": "Creation of the Association des Cadres Musulmans au Togo (ACMT)", "date": "2006-08-01", "category": "Religion"},
        {"country": "Togo", "event": "Implementation of the LMD reform", "date": "2008-07-21", "category": "Education"},
        {"country": "Benin", "event": "Implementation of the LMD reform", "date": "2010-06-11", "category": "Education"},
    ];
    
    const margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const parseDate = d3.timeParse("%Y-%m-%d");
    const x = d3.scaleTime().range([0, width]);

    data.forEach(d => {
        d.date = parseDate(d.date);
    });

    x.domain(d3.extent(data, d => d.date));

    const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height / 2 + ")")
        .call(xAxis);

    const eventGroup = svg.selectAll(".event-group")
        .data(data)
      .enter().append("g")
        .attr("class", d => `event-group ${d.country}`)
        .attr("transform", d => `translate(${x(d.date)}, ${d.country === "Togo" ? height / 2 - 40 : height / 2 + 40})`);

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

    eventGroup.append("text")
        .attr("dx", 10)
        .attr("dy", d => d.country === "Togo" ? -25 : 25)
        .attr("text-anchor", "start")
        .text(d => d.event)
        .style("font-size", "12px")
        .style("fill", "black");

    adjustTextPosition();

    d3.select("#categorySelect").on("change", function() {
        const selectedCategory = this.value;

        const filteredData = selectedCategory === "all" ? data : data.filter(d => d.category === selectedCategory);

        const eventGroupUpdate = svg.selectAll(".event-group")
            .data(filteredData, d => d.event);

        eventGroupUpdate.exit().remove();

        const eventGroupEnter = eventGroupUpdate.enter().append("g")
            .attr("class", d => `event-group ${d.country}`)
            .attr("transform", d => `translate(${x(d.date)}, ${d.country === "Togo" ? height / 2 - 40 : height / 2 + 40})`);

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

        eventGroupEnter.append("text")
            .attr("dx", 10)
            .attr("dy", d => d.country === "Togo" ? -25 : 25)
            .attr("text-anchor", "start")
            .text(d => d.event)
            .style("font-size", "12px")
            .style("fill", "black");

        eventGroupEnter.merge(eventGroupUpdate)
            .attr("transform", d => `translate(${x(d.date)}, ${d.country === "Togo" ? height / 2 - 40 : height / 2 + 40})`);

        eventGroupEnter.select(".event-line")
            .attr("y2", d => d.country === "Togo" ? -20 : 20)
            .attr("stroke", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4");

        eventGroupEnter.select(".event")
            .attr("cy", d => d.country === "Togo" ? -20 : 20)
            .attr("fill", d => d.country === "Togo" ? "#ff7f0e" : "#1f77b4");

        eventGroupEnter.select("text")
            .attr("dy", d => d.country === "Togo" ? -25 : 25)
            .text(d => d.event);

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
            .attr("transform", d => `translate(${newX(d.date)}, ${d.country === "Togo" ? height / 2 - 40 : height / 2 + 40})`);
        
        adjustTextPosition();
    }

    function adjustTextPosition() {
        const texts = svg.selectAll("text");

        texts.each(function(d, i) {
            const thisText = d3.select(this);
            const thisBBox = thisText.node().getBBox();
            let dy = thisText.attr("dy");

            texts.each(function(d2, j) {
                if (i === j) return;
                const otherText = d3.select(this);
                const otherBBox = otherText.node().getBBox();

                if (isOverlapping(thisBBox, otherBBox)) {
                    if (d.country === "Togo") {
                        dy -= 15;
                    } else {
                        dy += 15;
                    }
                    thisText.attr("dy", dy);
                }
            });
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
});
