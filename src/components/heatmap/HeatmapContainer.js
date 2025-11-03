import "./Heatmap.css";
import { useEffect, useRef, useCallback } from "react";
import HeatmapD3 from "./Heatmap-d3";

function HeatmapContainer({
  heatmapData,
  dimensions,
  selectedItems,
  heatmapControllerMethods,
}) {
  const divContainerRef = useRef(null);
  const heatmapD3Ref = useRef(null);

  const getChartSize = function () {
    let width = 800;
    let height = 600;
    if (divContainerRef.current !== null) {
      width = divContainerRef.current.offsetWidth;
      height = divContainerRef.current.offsetHeight - 4;
    }
    return { width: width, height: height };
  };

  // Memoize the controller methods
  const controllerMethods = useCallback(
    {
      updateSelectedItems: (items) => {
        console.log(
          "Heatmap selection updated:",
          items.length,
          "items selected"
        );
        heatmapControllerMethods.updateSelectedItems(items);
      },
    },
    [heatmapControllerMethods]
  );

  // Component did mount
  useEffect(() => {
    console.log(
      "HeatmapContainer useEffect [] called once the component did mount"
    );
    const heatmapD3 = new HeatmapD3(divContainerRef.current);
    heatmapD3.create({ size: getChartSize() });
    heatmapD3Ref.current = heatmapD3;

    return () => {
      console.log("HeatmapContainer cleanup");
      const heatmapD3 = heatmapD3Ref.current;
      heatmapD3.clear();
    };
  }, []);

  // Update when data or dimensions change
  useEffect(() => {
    console.log(
      "HeatmapContainer useEffect with dependency [heatmapData, dimensions]"
    );

    const heatmapD3 = heatmapD3Ref.current;
    if (heatmapD3 && heatmapData && heatmapData.length > 0) {
      heatmapD3.render(heatmapData, dimensions, controllerMethods);
    }
  }, [heatmapData, dimensions, controllerMethods]);

  // Update highlights when selectedItems change
  useEffect(() => {
    console.log("HeatmapContainer useEffect with dependency [selectedItems]");
    const heatmapD3 = heatmapD3Ref.current;
    if (heatmapD3 && selectedItems) {
      heatmapD3.highlightSelectedItems(selectedItems);
    }
  }, [selectedItems]);

  return <div ref={divContainerRef} className="heatmapDivContainer col2"></div>;
}

export default HeatmapContainer;
