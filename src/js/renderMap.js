async function BubbleMap(data, container) {
  const { width, height } = container.node().getBoundingClientRect();

  const margin = {
      top: 100,
      right: 100,
      bottom: 100,
      left: 30,
    },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

  const svg = container.select("svg");
  const tooltip = container.select("#tooltipContainer_map");

  const world_url = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

  const t = svg.transition().duration(750);
  const t2 = t.transition().duration(750);

  const usedLayters = ["figureLayer", "figureLayer1"];

  svg
    .selectAll("g")
    .data(usedLayters, (d) => d)
    .join(
      (enter) => enter,
      (update) => update.classed("is-active", true),
      (exit) => exit.classed("is-active", false).selectAll("*").remove()
    );

  const stationsIp = d3.select("#stationInput");

  stationsIp
    .selectAll("option")
    .data(data, (d) => d.station_id)
    .enter()
    .append("option")
    .attr("value", (d) => d.station_name)
    .attr("selected", (d) =>
      d.station_name == "Melbourne" ? "selected" : null
    )
    .text((d) => d.station_name);

  stationsIp.on("change", function (event, d) {
    const selected_statation_name = d3.select(this).property("value");
    d3.selectAll(".station_rect").classed("is-selected", false);
    d3.select(`#station_rect_${selected_statation_name.replace(" ", "_")}`)
      .classed("is-selected", true)
      .raise();
    console.log("changed!");
  });

  const g = svg.select(".figureLayer"),
    g1 = svg.select(".figureLayer1");

  g.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  g1.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);

  const gdata = await d3.json(world_url);

  const countries = topojson.feature(gdata, gdata.objects.countries);

  countries.features = countries.features.filter(
    (d) => d.properties.name == "Australia"
  );

  const projection = d3.geoMercator().fitExtent(
    [
      [0, 0],
      [innerWidth, innerHeight],
    ],
    countries
  );

  const map_path = d3.geoPath().projection(projection);

  g.selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("class", "map_path")
    .attr("d", map_path);

  const station_rect = g1.selectAll("rect").data(data, (d) => d.station_id);

  const mark_size = 15;

  station_rect
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "station_rect")
          .attr("id", (d) => `station_rect_${d.station_name.replace(" ", "_")}`)
          .attr("rx", (d) => mark_size)
          .attr("ry", (d) => mark_size)
          .attr("width", (d) => mark_size)
          .attr("height", (d) => mark_size)
          .attr("x", (d) => projection([d.lon, d.lat])[0] - mark_size / 2)
          .attr("y", (d) => projection([d.lon, d.lat])[1] - mark_size / 2),
      // .call((enter) =>
      //   enter
      //     .transition(t)
      //     .attr("rx", (d) => mark_size)
      //     .attr("ry", (d) => mark_size)
      //     .attr("width", (d) => mark_size)
      //     .attr("height", (d) => mark_size)
      //     .attr("x", (d) => projection([d.lon, d.lat])[0] - mark_size / 2)
      //     .attr("y", (d) => projection([d.lon, d.lat])[1] - mark_size / 2)
      // )
      (update) =>
        update.call((update) =>
          update
            .transition(t)
            .attr("width", (d) => mark_size)
            .attr("height", (d) => mark_size)
            .attr("rx", (d) => mark_size)
            .attr("ry", (d) => mark_size)
            .attr("x", (d) => projection([d.lon, d.lat])[0] - mark_size / 2)
            .attr("y", (d) => projection([d.lon, d.lat])[1] - mark_size / 2)
        ),
      (exit) =>
        exit.call((exit) =>
          exit.transition(t).attr("width", 0).attr("height", 0)
        )
    )
    .on("click", function (event, d) {
      d3.selectAll(".station_rect").classed("is-selected", false);
      d3.select(this).classed("is-selected", true).raise();
      stationsIp.property("value", d.station_name).dispatch("change");
    })
    .on("mouseover", (e, d) => {
      tooltip
        .style("display", "block")
        .html(() => `${d.station_id}<br><b>${d.station_name}</b>`);
    })
    .on("mousemove", (e, d) => {
      tooltip
        .style("left", d3.pointer(e)[0] + "px")
        .style("top", d3.pointer(e)[1] - 50 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });
}

export { BubbleMap };
