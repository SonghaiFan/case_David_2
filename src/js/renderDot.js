const tooltip = d3.select("#tooltipContainer1");

const dateFormat = d3.timeFormat("%e %B %Y");

let mark_size = 10;

function dodge(X, radius) {
  const Y = new Float64Array(X.length);
  const radius2 = radius ** 2;
  const epsilon = 1e-3;
  let head = null,
    tail = null;

  // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
  function intersects(x, y) {
    let a = head;
    while (a) {
      const ai = a.index;
      if (radius2 - epsilon > (X[ai] - x) ** 2 + (Y[ai] - y) ** 2) return true;
      a = a.next;
    }
    return false;
  }

  // Place each circle sequentially.
  for (const bi of d3.range(X.length).sort((i, j) => X[i] - X[j])) {
    // Remove circles from the queue that can’t intersect the new circle b.
    while (head && X[head.index] < X[bi] - radius2) head = head.next;

    // Choose the minimum non-intersecting tangent.
    if (intersects(X[bi], (Y[bi] = 0))) {
      let a = head;
      Y[bi] = Infinity;
      do {
        const ai = a.index;
        let y = Y[ai] + Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
        if (y < Y[bi] && !intersects(X[bi], y)) Y[bi] = y;
        a = a.next;
      } while (a);
    }

    // Add b to the queue.
    const b = { index: bi, next: null };
    if (head === null) head = tail = b;
    else tail = tail.next = b;
  }

  // if (height < d3.max(Y)) {
  //   return height * 2 < d3.max(Y)
  //     ? dodge(X, radius - 3, height)
  //     : dodge(X, radius - 1, height);
  // } else {
  //   return Y;
  // }
  return Y;
}

async function DotPlot(aqdata, container, { tickFormater }) {
  const { width, height } = container.node().getBoundingClientRect();

  const margin = {
      top: 100,
      right: 100,
      bottom: 100,
      left: 30,
    },
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;

  const data = aqdata.orderby(aq.desc("date")).objects();

  const svg = container.select("svg");

  const t = svg.transition().duration(750);
  const t2 = t.transition().duration(750);
  const t3 = t.transition().duration(750);

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
  gy.transition(t).attr(
    "transform",
    `translate(${margin.left - mark_size},${margin.top})`
  );

  const xValue = (d) => d.day_of_year;
  const yValue = (d) => d.value_final;

  const yScale = d3.scaleLinear().domain([-10, 50]).range([innerHeight, 0]);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, xValue))
    .range([0, innerWidth]);

  gx.transition(t).call(d3.axisBottom(xScale).tickFormat(tickFormater));

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
          .style("opacity", 0)
          .style("fill", (d) => d.color)
          .attr("id", (d) => `temp_rect_${d.year}_${d.day_of_year}`)
          .attr("rx", (d) => mark_size)
          .attr("ry", (d) => mark_size)
          .attr("width", (d) => mark_size)
          .attr("height", (d) => mark_size)
          .attr("x", (d) => xScale(xValue(d)) - mark_size / 2)
          .attr("y", (d) => yScale(yValue(d)) - mark_size / 2)
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
            .attr("x", (d) => xScale(xValue(d)) - mark_size / 2)
            .attr("y", (d) => yScale(yValue(d)) - mark_size / 2)
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

async function DotPlot_dodge(aqdata, container) {
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
    .orderby(aq.desc("date"))
    .derive({ index: (d) => op.row_number() - 1 })
    .objects();

  const svg = container.select("svg");
  // const tooltip = container.select("#tooltipContainer");

  const smart_duration = data.length < 100 ? 1500 : 750;

  const t = svg.transition().duration(smart_duration);
  const t2 = t.transition().duration(smart_duration);
  const t3 = t.transition().duration(smart_duration);

  const usedLayters = ["figureLayer1", "xAxisLayer"];

  const g1 = svg.select(".figureLayer1"),
    gx = svg.select(".xAxisLayer");

  const layers = svg
    .selectAll("g")
    .data(usedLayters, (d) => d)
    .join(
      (enter) => enter,
      (update) => update.classed("is-active", true),
      (exit) => exit.classed("is-active", false)
    );

  g1.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  gx.transition(t).attr(
    "transform",
    `translate(${margin.left},${innerHeight + margin.top})`
  );

  const padding = 0;

  const xValue = (d) => d.year;

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(data, xValue) - 1, d3.max(data, xValue) + 1])
    .range([0, innerWidth]);

  const X = d3.map(data, xValue).map((x) => (x == null ? NaN : +x));
  // Compute which data points are considered defined.
  const I = d3.range(X.length).filter((i) => !isNaN(X[i]));
  let Y = dodge(
    I.map((i) => xScale(X[i])),
    mark_size + padding,
    innerHeight
  );

  const dodgeyScale = (d) => innerHeight - mark_size - padding - Y[d.index];
  const dodgexScale = (d) => xScale(X[d.index]);

  gx.transition(t).call(d3.axisBottom(xScale));

  const smart_ease = function (d, i, n) {
    const orig_y = this.getAttribute("y");
    const targ_y = dodgeyScale(d);
    if (orig_y + mark_size < targ_y) {
      return d3.easeBounceOut;
    } else {
      return d3.easeExpOut;
    }
  };

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
          .attr("rx", (d) => mark_size)
          .attr("ry", (d) => mark_size)
          .attr("width", (d) => mark_size)
          .attr("height", (d) => mark_size)
          .attr("x", (d) => dodgexScale(d))
          .attr("y", -innerHeight)
          .call((enter) =>
            enter
              .transition(t3)
              .delay((d, i) => i)
              .ease(d3.easeBounceOut)
              .style("opacity", 1)
              .attr("y", (d) => dodgeyScale(d))
          ),
      (update) =>
        update.call((update) =>
          update
            .transition(t)
            .style("opacity", 1)
            .delay((d, i) => i)
            .style("fill", (d) => d.color)
            .attr("width", (d) => mark_size)
            .attr("height", (d) => mark_size)
            .attr("rx", (d) => mark_size)
            .attr("ry", (d) => mark_size)
            .attr("x", (d) => dodgexScale(d))
            .transition()
            .easeVarying(smart_ease)
            .attr("y", (d) => dodgeyScale(d))
        ),
      (exit) =>
        exit.call((exit) =>
          exit
            .transition(t)
            .ease(d3.easeCubicOut)
            .delay((d, i) => i)
            .attr("y", innerHeight * 2)
            .style("opacity", 0)
            .remove()
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

async function DotPlot_dodge2(aqdata, container) {
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
    // .select("date", "year", "decade", "day_of_year", "value_final")
    .derive({ index: (d) => op.row_number() - 1 })
    .objects();

  const svg = container.select("svg");
  // const tooltip = container.select("#tooltipContainer");

  const smart_duration = data.length < 100 ? 1500 : 750;

  const t = svg.transition().duration(smart_duration);
  const t2 = t.transition().duration(smart_duration);
  const t3 = t.transition().duration(smart_duration);

  const usedLayters = ["figureLayer1", "xAxisLayer"];

  const g1 = svg.select(".figureLayer1"),
    gx = svg.select(".xAxisLayer");

  const layers = svg
    .selectAll("g")
    .data(usedLayters, (d) => d)
    .join(
      (enter) => enter,
      (update) => update.classed("is-active", true),
      (exit) => exit.classed("is-active", false)
    );

  g1.transition(t).attr("transform", `translate(${margin.left},${margin.top})`);
  gx.transition(t).attr(
    "transform",
    `translate(${margin.left},${innerHeight + margin.top})`
  );

  const padding = 0;

  const xValue = (d) => d.value_final;

  const xScale = d3
    .scaleLinear()
    .domain([
      Math.floor(d3.min(data, xValue) * 2) / 2,
      Math.round(d3.max(data, xValue) * 2) / 2 + 0.5,
    ])
    .range([0, innerWidth]);

  console.log(xScale.domain());

  const X = d3.map(data, xValue).map((x) => (x == null ? NaN : +x));
  const I = d3.range(X.length).filter((i) => !isNaN(X[i]));
  const Y = dodge(
    I.map((i) => xScale(X[i])),
    mark_size + padding,
    innerHeight
  );

  const dodgeyScale = (d) => innerHeight - mark_size - Y[d.index];
  const dodgexScale = (d) => xScale(X[d.index]);

  gx.transition(t).call(d3.axisBottom(xScale));

  const temp_rect = g1
    .selectAll("rect")
    .data(data, (d) => `${d.year}_${d.day_of_year}`);

  const smart_ease = function (d, i, n) {
    const orig_y = this.getAttribute("y");
    const targ_y = dodgeyScale(d);
    if (orig_y + mark_size < targ_y) {
      return d3.easeBounceOut;
    } else {
      return d3.easeExpOut;
    }
  };

  temp_rect
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "temp_rect")
          .style("fill", (d) => d.color)
          .attr("id", (d) => `temp_rect_${d.year}_${d.day_of_year}`)
          .attr("rx", (d) => mark_size)
          .attr("ry", (d) => mark_size)
          .attr("width", (d) => mark_size)
          .attr("height", (d) => mark_size)
          .attr("x", (d) => dodgexScale(d))
          .attr("y", -innerHeight)
          .call((enter) =>
            enter
              .transition(t3)
              .delay((d, i) => i)
              .ease(d3.easeBounceOut)
              .attr("y", (d) => dodgeyScale(d))
          ),
      (update) =>
        update.call((update) =>
          update
            .transition(t2)
            .style("fill", (d) => d.color)
            .attr("width", (d) => mark_size)
            .attr("height", (d) => mark_size)
            .attr("rx", (d) => mark_size)
            .attr("ry", (d) => mark_size)
            .attr("x", (d) => dodgexScale(d))
            .transition()
            .easeVarying(smart_ease)
            .delay((d, i) => i)
            .attr("y", (d) => dodgeyScale(d))
        ),
      (exit) =>
        exit.call((exit) =>
          exit
            .transition(t)
            .ease(d3.easeCubicOut)
            .delay((d, i) => i)
            .attr("y", innerHeight * 2)
            .remove()
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

export { DotPlot, DotPlot_dodge, DotPlot_dodge2 };
