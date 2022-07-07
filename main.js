// Import the rendder fucntion

import { BubbleMap } from "./src/js/renderMap.js";
import { LineChart, LineChart_Dot } from "./src/js/renderLine.js";
import { DotPlot, DotPlot_dodge, DotPlot_dodge2 } from "./src/js/renderDot.js";
import { Histgram, Histgram2 } from "./src/js/renderBar.js";

// Declare the main manipulated DOMs as D3 selection objects

const figures = d3.selectAll(".figure");
const fig1 = d3.select("#fig1");
const fig_map = d3.select("#fig_map");

const article = d3.selectAll(".article");
const chapters = d3.selectAll(".chapter");
const steps = d3.selectAll(".step");

const navbar = d3.select("#navbar");

const stationsIp = d3.select("#stationInput");
const dateIp = d3.select("#dateInput");
const typeIp = d3.select("#typeInput");

// Load the data

const sdataPath = "src/data/stations.csv";
const tdataPath = "src/data/rich_mel_data.csv";

const aq_sdata = await aq.loadCSV(sdataPath);
const aq_tdata = await aq.loadCSV(tdataPath);

const sdata = aq_sdata.objects();
const tdata = aq_tdata.objects();

function dayOfYear(date) {
  return Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
}

$("#stationInput").change(renderPlot);
$("#dateInput").change(renderPlot);
$("#typeInput").change(renderPlot);
$("#threshInput").change(renderPlot);

// initialize the scrollama
const scroller = scrollama();

function renderPlot() {
  const selected_station = $("#stationInput").val();
  const selected_date_string = $("#dateInput").val();
  const selected_type = $("#typeInput").val();
  const selected_threshold = +$("#threshInput").val();

  const POI = {
    selected_station: selected_station,
    selected_date_string: selected_date_string,
    selected_type: selected_type,
    selected_threshold: selected_threshold,
  };

  scroller.onStepEnter((response) => handleStepEnter(response, POI));
  scroller.resize();
}

// preparation for rendering

function stepRenderTrigger(index, POI) {
  const selected_date = new Date(POI.selected_date_string);
  const selected_dayOfYear = dayOfYear(selected_date);
  const selected_month = selected_date.getMonth();
  const selected_year = selected_date.getFullYear();

  const grayColorScale = d3
    .scaleSequentialPow()
    .exponent(8)
    .domain([1910, 2022])
    .interpolator(
      d3.interpolateRgb("hsla(120, 0%, 83%, 0.5)", "hsla(0, 0%, 33%, 1.00)")
    );

  function customColorScale(d) {
    if (d.year == selected_year) {
      if (d.type == "tmax") {
        return "rgb(250, 77, 29)";
      }
      if (d.type == "tmin") {
        return "rgb(28, 106, 228)";
      }
    } else {
      return grayColorScale(d.year);
    }
  }

  const tdataPOI = aq_tdata
    .filter(aq.escape((d) => d.type == POI.selected_type))
    .derive({
      color: aq.escape((d) => customColorScale(d)),
    });

  const tdataPOIYear = tdataPOI.filter(
    aq.escape((d) => d.year == selected_year)
  );
  const tdataPOIYear2 = tdataPOI.filter(
    aq.escape((d) => (d.year == selected_year) | (d.year == 1910))
  );
  const tdataPOIYear2NearDays = tdataPOIYear2
    .filter(aq.escape((d) => d.day_of_year >= selected_dayOfYear - 7))
    .filter(aq.escape((d) => d.day_of_year <= selected_dayOfYear + 7));

  const tdataPOInearDays = tdataPOI
    .filter(aq.escape((d) => d.day_of_year >= selected_dayOfYear - 7))
    .filter(aq.escape((d) => d.day_of_year <= selected_dayOfYear + 7));

  const tdataPOInearDaysEx = tdataPOInearDays.filter(
    aq.escape((d) => d.temp_percentile >= POI.selected_threshold)
  );

  const tickFormater1 = (x) =>
    x - selected_dayOfYear == 0
      ? $("#dateInput").val()
      : `${x - selected_dayOfYear} Days`;

  switch (index) {
    case 0:
    case 1:
    case 2:
      LineChart(tdataPOIYear, fig1, {});
      break;
    case 3:
      LineChart(tdataPOIYear2, fig1, {});
      break;
    case 4:
      LineChart(tdataPOIYear2NearDays, fig1, {
        tickFormater: tickFormater1,
      });
      break;
    case 5:
      LineChart(tdataPOInearDays, fig1, {
        tickFormater: tickFormater1,
      });
      break;
    case 6:
      LineChart_Dot(tdataPOInearDays, fig1, {
        tickFormater: tickFormater1,
      });
      break;
    case 7:
      LineChart_Dot(tdataPOInearDaysEx, fig1, {
        tickFormater: tickFormater1,
      });
      DotPlot(tdataPOInearDaysEx, fig1, {
        tickFormater: tickFormater1,
      });
      break;
    case 8:
      DotPlot_dodge(tdataPOInearDaysEx, fig1);
      break;
    case 9:
      DotPlot_dodge2(tdataPOInearDaysEx, fig1);
      break;
    case 10:
      break;
    case 11:
      break;
    case 12:
      break;
    case 13:
      break;
    case 14:
      break;
    case 15:
      break;
  }
}

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  const stepH = Math.floor(window.innerHeight * 0.95);
  steps
    .style("margin-top", stepH / 2 + "px")
    .style("margin-bottom", stepH / 2 + "px");
  chapters.style("min-height", stepH + "px");

  const figureHeight = window.innerHeight * 0.9;
  const figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figures
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  // 3. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response, POI) {
  const { element, direction, index } = response;
  // add color to current step only
  steps.classed("active", false);
  d3.select(element).classed("active", true);

  // update graphic based on step
  figures.select("p").text(index);

  navbar.select("#next").attr("href", `#scrollama_step_${index + 1}`);
  navbar.select("#previous").attr("href", `#scrollama_step_${index - 1}`);

  d3.select("#dynamic_nav_container").selectAll("a").classed("active", false);
  d3.select(`#scrollama_step_tag_${index}`).classed("active", true);

  stepRenderTrigger(index, POI);
}

function setStepNavigationBar() {
  d3.selectAll(":is(.chapter,.step)").each(function () {
    const scrololama_index = d3.select(this).attr("data-scrollama-index");

    d3.select(this).attr("id", `scrollama_step_${scrololama_index}`);

    const symbol = d3.select(this).attr("class") == "step" ? "●" : "■";

    d3.select("#dynamic_nav_container")
      .append("a")
      .text(symbol)
      .attr("id", `scrollama_step_tag_${scrololama_index}`)
      .attr("href", `#scrollama_step_${scrololama_index}`);
  });
}

function initialCanvas() {
  const defaultLayters = [
    "figureLayer",
    "figureLayer1",
    "figureLayer2",
    "figureLayer3",
    "figureLayer4",
    "xAxisLayer",
    "yAxisLayer",
    "anotationLayer",
  ];

  figures
    .append("svg")
    .selectAll("g")
    .data(defaultLayters)
    .enter()
    .append("g")
    .attr("class", (d) => `layer ${d}`);
}

function init() {
  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();
  initialCanvas();

  // 2. setup the scroller passing options
  // 		this will also initialize trigger observations

  scroller.setup({
    step: ":is(.chapter,.step)",
    offset: 0.5,
  });

  // 3. bind scrollama event handlers (this can be chained like below)
  const POI = {
    selected_station: "Melbourne",
    selected_date_string: "2022-01-14",
    selected_type: "tmax",
    selected_threshold: "95",
  };
  scroller.onStepEnter((response) => handleStepEnter(response, POI));

  setStepNavigationBar();

  BubbleMap(sdata, fig_map);

  // localStorage.setItem("selected_date_string", selected_date_string);
}

const interestbar = document.getElementById("interestbar");
const stickyOffset = interestbar.offsetTop;

function stickyBar() {
  if (window.pageYOffset >= stickyOffset) {
    interestbar.classList.add("sticky-top");
  } else {
    interestbar.classList.remove("sticky-top");
  }
}

// kick things off
window.onload = () => init();
window.onscroll = () => stickyBar();
window.addEventListener("resize", handleResize);
