const dateFormat = d3.timeFormat("%e %B %Y");

const tooltip = d3.select("#tooltipContainer1");

async function Histgram(aqdata, container) {
  const { width, height } = container.node().getBoundingClientRect();

  const margin = {
      top: 30,
      right: 100,
      bottom: 100,
      left: 30,
    },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

  const data = aqdata
    .orderby(aq.desc("date"))
    .derive({ bin: aq.bin("value_final", { step: 0.5 }) })
    .groupby("bin")
    .derive({ hist_y1: aq.rolling((d) => op.sum(1)) })
    .derive({ hist_y0: (d) => op.lag(d.hist_y1, 1, 0) })
    .orderby("bin")
    .objects();

  const svg = container.select("svg");

  const smart_duration = data.length < 100 ? 1500 : 750;

  const t = svg.transition().duration(smart_duration);
  const t2 = t.transition().duration(smart_duration);
  const t3 = t.transition().duration(smart_duration);

  const usedLayters = ["figureLayer1", "xAxisLayer", "yAxisLayer"];

  const layers = svg
    .selectAll("g")
    .data(usedLayters, (d) => d)
    .join(
      (enter) => enter,
      (update) => update.classed("is-active", true),
      (exit) => exit.classed("is-active", false)
    );

  const g1 = svg.select(".figureLayer1"),
    gx = svg.select(".xAxisLayer"),
    gy = svg.select(".yAxisLayer");

  g1.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  gx.transition(t).attr(
    "transform",
    `translate(${margin.left},${innerHeight + margin.top})`
  );
  gy.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);

  const xValue = (d) => d.bin;
  const yValue = (d) => d.hist_y1;

  const padding = 0;

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, yValue)])
    .range([innerHeight, 0]);

  const xScale = d3
    .scaleBand()
    .domain(
      d3.range(
        Math.floor(d3.min(data, xValue) * 2) / 2,
        Math.round(d3.max(data, xValue) * 2) / 2 + 0.6,
        0.5
      )
    )
    .range([0, innerWidth])
    .paddingInner(0)
    .paddingOuter(-0.5)
    .round(false);
  console.log(xScale.domain());

  gx.transition(t)
    .call(d3.axisBottom(xScale))
    .call((g) => g.selectAll("line").attr("y2", -innerHeight));

  gy.transition(t).call(
    d3
      .axisLeft(yScale)
      .tickFormat(d3.format("~s"))
      .ticks(Math.round(width / 100))
  );

  const temp_rect = g1
    .selectAll("rect")
    .data(data, (d) => `${d.year}_${d.day_of_year}`);

  temp_rect
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "temp_rect")
          .style("fill", (d) => d.color)
          .attr("id", (d) => `temp_rect_${d.year}_${d.day_of_year}`)
          .attr("width", xScale.bandwidth())
          .attr("height", 0)
          .attr("x", (d) => xScale(xValue(d)) + xScale.bandwidth() / 2)
          .attr("y", innerHeight)
          .call((enter) =>
            enter
              .transition(t3)
              .attr(
                "height",
                (d) => innerHeight - yScale(d.hist_y1 - d.hist_y0)
              )
              .attr("y", (d) => yScale(yValue(d)))
          ),
      (update) =>
        update.call((update) =>
          update
            .transition(t2)
            .style("fill", (d) => d.color)
            .attr("width", xScale.bandwidth())
            .attr("rx", 0)
            .attr("ry", 0)
            .attr("x", (d) => xScale(xValue(d)) + xScale.bandwidth() / 2)
            .attr("height", (d) => innerHeight - yScale(d.hist_y1 - d.hist_y0))
            .attr("y", (d) => yScale(yValue(d)))
        ),
      (exit) =>
        exit.call((exit) =>
          exit.transition(t).attr("y", innerHeight).attr("height", 0).remove()
        )
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

async function Histgram2(aqdata, container) {
  const { width, height } = container.node().getBoundingClientRect();

  const margin = {
      top: 30,
      right: 100,
      bottom: 100,
      left: 30,
    },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

  const data = aqdata
    .orderby(aq.desc("date"))
    .impute({ value_final: () => 0 })
    .groupby({ bin: aq.bin("value_final", { step: 0.5 }) })
    .count()
    .orderby("bin")
    .objects();

  const svg = container.select("svg");

  const smart_duration = data.length < 100 ? 1500 : 750;

  const t = svg.transition().duration(smart_duration);
  const t2 = t.transition().duration(smart_duration);
  const t3 = t.transition().duration(smart_duration);

  const usedLayters = ["figureLayer1", "xAxisLayer", "yAxisLayer"];

  const layers = svg
    .selectAll("g")
    .data(usedLayters, (d) => d)
    .join(
      (enter) => enter,
      (update) => update.classed("is-active", true),
      (exit) => exit.classed("is-active", false)
    );

  const g3 = svg.select(".figureLayer1"),
    gx = svg.select(".xAxisLayer"),
    gy = svg.select(".yAxisLayer");

  g3.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  gx.transition(t).attr(
    "transform",
    `translate(${margin.left},${innerHeight + margin.top})`
  );
  gy.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);

  const xValue = (d) => d.bin;
  const yValue = (d) => d.count;

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, yValue)])
    .range([innerHeight, 0]);

  const xScale = d3
    .scaleBand()
    .domain(
      d3.range(
        Math.floor(d3.min(data, xValue) * 2) / 2,
        Math.round(d3.max(data, xValue) * 2) / 2 + 0.6,
        0.5
      )
    )
    .range([0, innerWidth])
    .paddingInner(0)
    .paddingOuter(-0.5)
    .round(false);
  console.log(xScale.domain());

  const line = d3
    .line()
    .curve(d3.curveBumpX)
    .x((d) => xScale(xValue(d)))
    .y((d) => yScale(yValue(d)));

  gx.transition(t).call(d3.axisBottom(xScale));

  gy.transition(t).call(d3.axisLeft(yScale));
  console.log(data);

  const hist_line = g3.selectAll("path").datum(data);

  hist_line.join(
    (enter) =>
      enter
        .append("path")
        .attr("stroke-width", 0)
        .attr("opacity", 0)
        .attr("d", (d) => line(d))
        .call((enter) =>
          enter
            .transition(t3)
            .attr("opacity", 1)
            .attr("fill", "none")
            .attr("stroke-width", 5)
        ),
    (update) =>
      update.call((update) => update.transition(t2).attr("d", (d) => line(d))),
    (exit) =>
      exit.call((exit) =>
        exit.transition(t).attr("stroke-width", 0).attr("opacity", 0).remove()
      )
  );

  const temp_rect = g3.selectAll("rect").data(data, (d) => `temp_bin${d.bin}`);

  temp_rect.join(
    (enter) =>
      enter
        .append("rect")
        .attr("class", "temp_bin")
        .style("fill", (d) => custom_colorScale(d))
        .attr("id", (d) => `temp_bin${d.bin}`)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("x", (d) => xScale(xValue(d)) + xScale.bandwidth() / 2)
        .attr("y", innerHeight)
        .call((enter) =>
          enter
            .transition(t3)
            .attr("height", (d) => innerHeight - yScale(yValue(d)))
            .attr("y", (d) => yScale(yValue(d)))
        ),
    (update) =>
      update.call((update) =>
        update
          .transition(t2)
          .style("fill", (d) => custom_colorScale(d))
          .attr("width", xScale.bandwidth())
          .attr("rx", 0)
          .attr("ry", 0)
          .attr("x", (d) => xScale(xValue(d)) + xScale.bandwidth() / 2)
          .attr("height", (d) => innerHeight - yScale(yValue(d)))
          .attr("y", (d) => yScale(yValue(d)))
      ),
    (exit) =>
      exit.call((exit) =>
        exit.transition(t).attr("y", innerHeight).attr("height", 0).remove()
      )
  );
}

export { Histgram, Histgram2 };
