import * as d3 from 'd3'

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    matSvg;
    defaultOpacity=0.3;
    transitionDuration=1000;
    circleRadius = 3;
    xScale;
    yScale;
    brush;
    brushG;
    currentData = [];
    currentXAttribute = '';
    currentYAttribute = '';
    controllerMethods = null;
    isBrushing = false;

    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom ;
        
        console.log("create SVG width=" + (this.width + this.margin.left + this.margin.right ) + " height=" + (this.height+ this.margin.top + this.margin.bottom));
        
        this.matSvg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","matSvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);

        // Create brush
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start", this.brushStarted.bind(this))
            .on("brush", this.brushing.bind(this))
            .on("end", this.brushEnded.bind(this));

        // Append brush to SVG
        this.brushG = this.matSvg.append("g")
            .attr("class", "brush")
            .call(this.brush);

        // build xAxisG
        this.matSvg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")");
        
        this.matSvg.append("g")
            .attr("class","yAxisG");
    }

    brushStarted(event) {
        this.isBrushing = true;
        // Clear previous selection when starting new brush
        if (this.controllerMethods && event.selection === null) {
            this.controllerMethods.updateSelectedItems([]);
        }
    }

    brushing(event) {
        if (!event.selection || !this.isBrushing) return;
        
        const [[x0, y0], [x1, y1]] = event.selection;
        
        // Find items within the brush selection
        const selectedItems = this.currentData.filter(item => {
            const x = this.xScale(item[this.currentXAttribute]);
            const y = this.yScale(item[this.currentYAttribute]);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });

        // Only update visualization locally during brushing for performance
        this.highlightSelectedItems(selectedItems);
    }

    brushEnded(event) {
        this.isBrushing = false;
        
        if (!this.controllerMethods) return;

        const selection = event.selection;
        if (!selection) {
            // Brush was cleared - only update if we had a previous selection
            this.controllerMethods.updateSelectedItems([]);
            return;
        }

        // Get the brush coordinates
        const [[x0, y0], [x1, y1]] = selection;
        
        // Find items within the brush selection
        const selectedItems = this.currentData.filter(item => {
            const x = this.xScale(item[this.currentXAttribute]);
            const y = this.yScale(item[this.currentYAttribute]);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });

        console.log("Brush ended, selected items:", selectedItems.length);
        this.controllerMethods.updateSelectedItems(selectedItems);
    }

    clearBrush() {
        this.brushG.call(this.brush.move, null);
    }

    changeBorderAndOpacity(selection, selected){
        selection.style("opacity", selected ? 1 : this.defaultOpacity)
            .select(".markerCircle")
            .attr("stroke-width", selected ? 2 : 0)
            .attr("stroke", selected ? "red" : "none");
    }

    updateMarkers(selection, xAttribute, yAttribute){
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item) => {
                const xPos = this.xScale(item[xAttribute]);
                const yPos = this.yScale(item[yAttribute]);
                return "translate("+xPos+","+yPos+")";
            });
        this.changeBorderAndOpacity(selection, false);
    }

    highlightSelectedItems(selectedItems){
        if (!this.currentData.length) return;

        this.matSvg.selectAll(".markerG")
            .each(function(itemData) {
                const isSelected = selectedItems.some(selectedItem => 
                    selectedItem.index === itemData.index
                );
                d3.select(this)
                    .style("opacity", isSelected ? 1 : 0.3)
                    .select(".markerCircle")
                    .attr("stroke-width", isSelected ? 2 : 0)
                    .attr("stroke", isSelected ? "red" : "none");
            });
    }

    updateAxis = function(visData, xAttribute, yAttribute){
        const minXAxis = d3.min(visData.map((item) => item[xAttribute]));
        const maxXAxis = d3.max(visData.map((item) => item[xAttribute]));
        const minYAxis = d3.min(visData.map((item) => item[yAttribute]));
        const maxYAxis = d3.max(visData.map((item) => item[yAttribute]));

        this.xScale.domain([minXAxis, maxXAxis]);
        this.yScale.domain([minYAxis, maxYAxis]);

        this.matSvg.select(".xAxisG")
            .transition().duration(500)
            .call(d3.axisBottom(this.xScale));
        
        this.matSvg.select(".yAxisG")
            .transition().duration(500)
            .call(d3.axisLeft(this.yScale));
    }

    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        console.log("render scatterplot with a new data list ...");
        
        // Store current data and attributes for brush functionality
        this.currentData = visData || [];
        this.currentXAttribute = xAttribute;
        this.currentYAttribute = yAttribute;
        this.controllerMethods = controllerMethods;

        // Only update axes and markers if data actually changed
        if (visData && visData.length > 0) {
            // Build the size scales and x,y axis
            this.updateAxis(visData, xAttribute, yAttribute);

            this.matSvg.selectAll(".markerG")
                .data(visData, (itemData) => itemData.index)
                .join(
                    enter => {
                        const itemG = enter.append("g")
                            .attr("class", "markerG")
                            .style("opacity", this.defaultOpacity);
                        
                        itemG.append("circle")
                            .attr("class", "markerCircle")
                            .attr("r", this.circleRadius)
                            .attr("fill", "steelblue")
                            .attr("stroke", "none");
                        
                        this.updateMarkers(itemG, xAttribute, yAttribute);
                    },
                    update => {
                        this.updateMarkers(update, xAttribute, yAttribute);
                    },
                    exit => {
                        exit.remove();
                    }
                );
        }

    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}

export default ScatterplotD3;