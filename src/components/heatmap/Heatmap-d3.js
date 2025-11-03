import * as d3 from "d3";

class HeatmapD3 {
  margin = { top: 120, right: 50, bottom: 120, left: 100 };
  width = 600;
  height = 500;
  svg;
  x;
  y;
  color;
  currentData = [];
  dimensions = [];
  controllerMethods = null;
  globalCorrelationMatrix = [];

  constructor(el) {
    this.el = el;
  }

  create(config) {
    this.width = config.size.width - this.margin.left - this.margin.right;
    this.height = config.size.height - this.margin.top - this.margin.bottom;

    this.svg = d3
      .select(this.el)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    return this;
  }

  render(visData, dimensions, controllerMethods) {
    this.currentData = visData || [];
    this.controllerMethods = controllerMethods;
    this.dimensions = dimensions || [
      "area",
      "price",
      "bedrooms",
      "bathrooms",
      "stories",
      "parking",
    ];

    // Clear previous content
    this.svg.selectAll("*").remove();

    if (this.currentData.length === 0) {
      console.log("No data available for heatmap");
      return;
    }

    // Compute and store global correlations
    this.globalCorrelationMatrix = this.computeCorrelationMatrixForData(
      this.currentData
    );

    // Draw initial heatmap with global correlations
    this.drawHeatmap(this.globalCorrelationMatrix, "All Data");
  }

  drawHeatmap(matrix, title) {
    // Scales
    this.x = d3
      .scaleBand()
      .domain(this.dimensions)
      .range([0, this.width])
      .padding(0.05);

    this.y = d3
      .scaleBand()
      .domain(this.dimensions)
      .range([0, this.height])
      .padding(0.05);

    // Color scale
    const corrValues = matrix.map((d) => d.value);
    const maxAbsCorr = Math.max(
      Math.abs(d3.min(corrValues) || 0),
      Math.abs(d3.max(corrValues) || 0)
    );

    this.color = d3
      .scaleSequential(d3.interpolateRdBu)
      .domain([maxAbsCorr, -maxAbsCorr]);

    // Draw cells
    const cells = this.svg
      .selectAll(".cell")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "cell")
      .attr("transform", (d) => `translate(${this.x(d.x)},${this.y(d.y)})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        this.handleCellClick(d);
      });

    cells
      .append("rect")
      .attr("width", this.x.bandwidth())
      .attr("height", this.y.bandwidth())
      .attr("fill", (d) => this.color(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Add correlation values as text
    cells
      .append("text")
      .attr("x", this.x.bandwidth() / 2)
      .attr("y", this.y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", (d) => (Math.abs(d.value) > 0.5 ? "white" : "black"))
      .text((d) => d3.format(".2f")(d.value));

    // Add x-axis labels
    this.svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(this.x))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-45)")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em")
      .attr("font-size", "12px");

    // Add y-axis labels
    this.svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(this.y))
      .selectAll("text")
      .attr("font-size", "12px");

    // Add dynamic title
    this.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2)
      .attr("y", -80)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(`Correlation Matrix - ${title}`);

    // Add color legend
    this.drawColorLegend(maxAbsCorr);
  }

  drawColorLegend(maxAbsCorr) {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = this.width - legendWidth - 10;
    const legendY = -50;

    const legendSvg = this.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendX},${legendY})`);

    const gradient = legendSvg
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    // Create gradient stops
    const stops = [-maxAbsCorr, 0, maxAbsCorr];
    gradient
      .selectAll("stop")
      .data(stops)
      .enter()
      .append("stop")
      .attr("offset", (d, i) => `${(i / (stops.length - 1)) * 100}%`)
      .attr("stop-color", (d) => this.color(d));

    legendSvg
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)")
      .attr("stroke", "#000");

    // Add legend labels
    legendSvg
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .attr("font-size", "10px")
      .text(d3.format(".1f")(-maxAbsCorr));

    legendSvg
      .append("text")
      .attr("x", legendWidth)
      .attr("y", -5)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .text(d3.format(".1f")(maxAbsCorr));

    legendSvg
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text("Correlation");
  }

  computeCorrelationMatrixForData(data) {
    const matrix = [];
    for (let i = 0; i < this.dimensions.length; i++) {
      for (let j = 0; j < this.dimensions.length; j++) {
        const xDim = this.dimensions[i];
        const yDim = this.dimensions[j];

        // For diagonal (same variable), correlation is 1
        if (i === j) {
          matrix.push({ x: xDim, y: yDim, value: 1 });
          continue;
        }

        const correlation = this.computeCorrelation(
          data.map((d) => +d[xDim]),
          data.map((d) => +d[yDim])
        );
        matrix.push({ x: xDim, y: yDim, value: correlation });
      }
    }
    return matrix;
  }

  computeCorrelation(x, y) {
    const n = x.length;
    if (n <= 1) return 0;

    // Filter out NaN values
    const cleanData = [];
    for (let i = 0; i < n; i++) {
      if (!isNaN(x[i]) && !isNaN(y[i]) && isFinite(x[i]) && isFinite(y[i])) {
        cleanData.push({ x: x[i], y: y[i] });
      }
    }

    if (cleanData.length <= 1) return 0;

    const cleanX = cleanData.map((d) => d.x);
    const cleanY = cleanData.map((d) => d.y);

    const meanX = d3.mean(cleanX);
    const meanY = d3.mean(cleanY);

    const stdX = d3.deviation(cleanX);
    const stdY = d3.deviation(cleanY);

    // If standard deviation is zero, return 0 to avoid division by zero
    if (stdX === 0 || stdY === 0) return 0;

    let numerator = 0;
    for (let i = 0; i < cleanData.length; i++) {
      numerator += (cleanData[i].x - meanX) * (cleanData[i].y - meanY);
    }

    const correlation = numerator / ((cleanData.length - 1) * stdX * stdY);

    // Handle potential floating point errors
    return Math.max(-1, Math.min(1, correlation || 0));
  }

  handleCellClick(cellData) {
    if (!this.controllerMethods) return;

    // When clicking a cell, select data points that are in the top quartile
    // for both dimensions (showing strong positive correlation examples)
    const xValues = this.currentData
      .map((item) => +item[cellData.x])
      .filter((val) => !isNaN(val))
      .sort((a, b) => a - b);
    const yValues = this.currentData
      .map((item) => +item[cellData.y])
      .filter((val) => !isNaN(val))
      .sort((a, b) => a - b);

    if (xValues.length === 0 || yValues.length === 0) return;

    const xThreshold = xValues[Math.floor(xValues.length * 0.75)]; // 75th percentile
    const yThreshold = yValues[Math.floor(yValues.length * 0.75)]; // 75th percentile

    const selectedItems = this.currentData.filter((item) => {
      const xVal = +item[cellData.x];
      const yVal = +item[cellData.y];
      return (
        !isNaN(xVal) && !isNaN(yVal) && xVal >= xThreshold && yVal >= yThreshold
      );
    });

    console.log(
      `Heatmap cell clicked: ${cellData.x} vs ${cellData.y}, selected ${selectedItems.length} items`
    );
    this.controllerMethods.updateSelectedItems(selectedItems);
  }

  highlightSelectedItems(selectedItems) {
    if (!selectedItems || selectedItems.length === 0) {
      // Show global correlations when nothing is selected
      this.updateHeatmapCells(this.globalCorrelationMatrix, "All Data");
      return;
    }

    // Compute correlations for selected items only
    const selectedCorrelationMatrix =
      this.computeCorrelationMatrixForData(selectedItems);

    // Update the heatmap with selected correlations
    this.updateHeatmapCells(
      selectedCorrelationMatrix,
      `Selected (${selectedItems.length} houses)`
    );
  }

  updateHeatmapCells(matrix, title) {
    // Update cell colors
    this.svg
      .selectAll(".cell")
      .data(matrix)
      .select("rect")
      .transition()
      .duration(500)
      .attr("fill", (d) => this.color(d.value));

    // Update cell text
    this.svg
      .selectAll(".cell")
      .data(matrix)
      .select("text")
      .transition()
      .duration(500)
      .text((d) => d3.format(".2f")(d.value))
      .attr("fill", (d) => (Math.abs(d.value) > 0.5 ? "white" : "black"));

    // Update title to show what's being displayed
    this.svg.select(".chart-title").remove();
    this.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", this.width / 2)
      .attr("y", -80)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(`Correlation Matrix - ${title}`);

    // Update color scale for the new data range
    const corrValues = matrix.map((d) => d.value);
    const maxAbsCorr = Math.max(
      Math.abs(d3.min(corrValues) || 0),
      Math.abs(d3.max(corrValues) || 0)
    );

    this.color = d3
      .scaleSequential(d3.interpolateRdBu)
      .domain([maxAbsCorr, -maxAbsCorr]);

    // Update legend
    this.svg.select(".legend").remove();
    this.drawColorLegend(maxAbsCorr);
  }

  clear() {
    d3.select(this.el).selectAll("*").remove();
  }
}

export default HeatmapD3;
