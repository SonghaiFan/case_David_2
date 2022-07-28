const mark_size = 5;
const tooltip = d3.select("#tooltipContainer1");

const dateFormat = d3.timeFormat("%e %B %Y");

async function LineChart(aqdata, container, { tickFormater }) {
  const { width, height } = container.node().getBoundingClientRect();

  const margin = {
      top: 100,
      right: 100,
      bottom: 100,
      left: 30,
    },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

  const data = aqdata
    .groupby("year")
    .orderby("day_of_year")
    .derive({
      value_final_lead: (d) =>
        op.is_nan(+op.lead(d.value_final))
          ? d.value_final
          : op.lead(d.value_final),
    })
    .derive({
      day_of_year_lead: (d) =>
        op.is_nan(+op.lead(d.day_of_year))
          ? d.day_of_year
          : op.lead(d.day_of_year),
    })
    .derive({
      value_final_diff: (d) => op.abs(d.value_final_lead - d.value_final),
    })
    .derive({
      value_final_diff_rolsum: aq.rolling((d) => op.sum(d.value_final_diff)),
    })
    .orderby(aq.desc("date"))
    .objects();

  const svg = container.select("svg");

  const t = svg.transition().duration(750);
  const t2 = t.transition().duration(750);
  const t3 = t.transition().duration(750);

  const usedLayters = [
    "figureLayer",
    "figureLayer1",
    "xAxisLayer",
    "yAxisLayer",
  ];

  const layers = svg
    .selectAll("g")
    .data(usedLayters, (d) => d)
    .join(
      (enter) => enter,
      (update) => update.classed("is-active", true),
      (exit) => exit.classed("is-active", false)
    );

  const g = svg.select(".figureLayer"),
    g1 = svg.select(".figureLayer1"),
    gx = svg.select(".xAxisLayer"),
    gy = svg.select(".yAxisLayer");

  g1.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  g.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  gx.transition(t).attr(
    "transform",
    `translate(${margin.left},${innerHeight + margin.top})`
  );
  gy.transition(t).attr(
    "transform",
    `translate(${margin.left - mark_size},${margin.top})`
  );

  // data.sort((a, b) => a.date - b.date);

  const x1Value = (d) => d.day_of_year;
  const y1Value = (d) => d.value_final;
  const x2Value = (d) => d.day_of_year_lead;
  const y2Value = (d) => d.value_final_lead;

  const yScale = d3.scaleLinear().domain([-10, 50]).range([innerHeight, 0]);

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(data, x1Value), d3.max(data, x1Value)])
    .range([0, innerWidth])
    .nice();

  gx.transition(t).call(d3.axisBottom(xScale).tickFormat(tickFormater));

  gy.transition(t).call(
    d3
      .axisLeft(yScale)
      .tickFormat(d3.format("~s"))
      .ticks(Math.round(width / 100))
  );

  const temp_lines = g
    .selectAll("line")
    .data(data, (d) => `${d.year}_${d.day_of_year}`);

  temp_lines
    .join(
      (enter) =>
        enter
          .append("line")
          .attr("class", "temp_line")
          .attr("id", (d) => `temp_line'_${d.year}_${d.day_of_year}`)
          .style("opacity", 0)
          .style("stroke", (d) => d.color)
          .style("stroke-width", null)
          .attr("x1", (d) => xScale(x1Value(d)))
          .attr("y1", (d) => yScale(y1Value(d)))
          .attr("x2", (d) => xScale(x2Value(d)))
          .attr("y2", (d) => yScale(y2Value(d)))
          .call((enter) =>
            enter
              .transition(t3)
              .delay((d) => (d.year - 1910) * 5)
              .style("opacity", 1)
          ),
      (update) =>
        update.call((update) =>
          update
            .transition(t2)
            .style("opacity", 1)
            .style("stroke", (d) => d.color)
            .style("stroke-width", null)
            .attr("x1", (d) => xScale(x1Value(d)))
            .attr("y1", (d) => yScale(y1Value(d)))
            .attr("x2", (d) => xScale(x2Value(d)))
            .attr("y2", (d) => yScale(y2Value(d)))
        ),
      (exit) =>
        exit.call((exit) => exit.transition(t).style("opacity", 0).remove())
    )
    .lower();

  const temp_rect = g1
    .selectAll("rect")
    .data(data, (d) => `${d.year}_${d.day_of_year}`);

  temp_rect
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "temp_rect")
          .style("opacity", 0)
          .style("fill", (d) => d.color)
          .attr("id", (d) => `temp_rect_${d.year}_${d.day_of_year}`)
          .attr("rx", (d) => mark_size)
          .attr("ry", (d) => mark_size)
          .attr("width", (d) => mark_size)
          .attr("height", (d) => mark_size)
          .attr("x", (d) => xScale(x1Value(d)) - mark_size / 2)
          .attr("y", (d) => yScale(y1Value(d)) - mark_size / 2)
          .call((enter) => enter.transition(t3).style("opacity", 1)),
      (update) =>
        update.call((update) =>
          update
            .transition(t2)
            .style("opacity", 1)
            .style("fill", (d) => d.color)
            .attr("width", (d) => mark_size)
            .attr("height", (d) => mark_size)
            .attr("rx", (d) => mark_size)
            .attr("ry", (d) => mark_size)
            .attr("x", (d) => xScale(x1Value(d)) - mark_size / 2)
            .attr("y", (d) => yScale(y1Value(d)) - mark_size / 2)
        ),
      (exit) =>
        exit.call((exit) => exit.transition(t).style("opacity", 0).remove())
    )
    .on("mouseover", (e, d) => {
      tooltip
        .style("display", "block")
        .html(() => `${dateFormat(d.date)} <b>${d.value_final}°</b>`);
    })
    .on("mousemove", (e, d) => {
      tooltip
        .style("left", d3.pointer(e)[0] + 25 + margin.left + "px")
        .style("top", d3.pointer(e)[1] - 25 + margin.top + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });
}

export { LineChart };
