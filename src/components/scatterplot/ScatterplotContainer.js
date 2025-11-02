import './Scatterplot.css'
import {useEffect, useRef, useCallback} from 'react';
import ScatterplotD3 from './Scatterplot-d3';

function ScatterplotContainer({scatterplotData, xAttribute, yAttribute, selectedItems, scatterplotControllerMethods}){

    const divContainerRef = useRef(null);
    const scatterplotD3Ref = useRef(null);

    const getChartSize = function(){
        let width;
        let height;
        if(divContainerRef.current !== null){
            width = divContainerRef.current.offsetWidth;
            height = divContainerRef.current.offsetHeight - 4;
        }
        return {width: width, height: height};
    }

    // Memoize the controller methods to prevent unnecessary re-renders
    const controllerMethods = useCallback({
        updateSelectedItems: (items) => {
            console.log("Brush selection updated:", items.length, "items selected");
            scatterplotControllerMethods.updateSelectedItems(items);
        }
    }, [scatterplotControllerMethods]);

    // did mount called once the component did mount
    useEffect(() => {
        console.log("ScatterplotContainer useEffect [] called once the component did mount");
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size: getChartSize()});
        scatterplotD3Ref.current = scatterplotD3;
        
        return () => {
            console.log("ScatterplotContainer useEffect [] return function, called when the component did unmount...");
            const scatterplotD3 = scatterplotD3Ref.current;
            scatterplotD3.clear();
        }
    }, []);

    // Only update when data or attributes actually change
    useEffect(() => {
        console.log("ScatterplotContainer useEffect with dependency [scatterplotData, xAttribute, yAttribute]");
        
        const scatterplotD3 = scatterplotD3Ref.current;
        if (scatterplotD3 && scatterplotData && scatterplotData.length > 0) {
            scatterplotD3.renderScatterplot(scatterplotData, xAttribute, yAttribute, controllerMethods);
        }
    }, [scatterplotData, xAttribute, yAttribute, controllerMethods]);

    // Update highlights when selectedItems change (from external sources)
    useEffect(() => {
        console.log("ScatterplotContainer useEffect with dependency [selectedItems], called each time selectedItems changes...");
        const scatterplotD3 = scatterplotD3Ref.current;
        if (scatterplotD3 && selectedItems) {
            scatterplotD3.highlightSelectedItems(selectedItems);
        }
    }, [selectedItems]);

    return(
        <div ref={divContainerRef} className="scatterplotDivContainer col2">
        </div>
    )
}

export default ScatterplotContainer;