// App.js
import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { fetchCSV } from "./utils/helper";
import ScatterplotContainer from "./components/scatterplot/ScatterplotContainer";
import HeatmapContainer from "./components/heatmap/HeatmapContainer";

function App() {
    console.log("App component function call...");
    const [data, setData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    // Memoize the controller methods to prevent unnecessary re-renders
    const scatterplotControllerMethods = useCallback({
        updateSelectedItems: (items) => {
            console.log("Scatterplot selection:", items.length, "items");
            setSelectedItems(prevItems => {
                if (prevItems.length !== items.length) return items;
                const hasChange = items.some((item, index) => 
                    !prevItems[index] || item.index !== prevItems[index].index
                );
                return hasChange ? items : prevItems;
            });
        }
    }, []);

    const heatmapControllerMethods = useCallback({
        updateSelectedItems: (items) => {
            console.log("Heatmap selection:", items.length, "items");
            setSelectedItems(prevItems => {
                if (prevItems.length !== items.length) return items;
                const hasChange = items.some((item, index) => 
                    !prevItems[index] || item.index !== prevItems[index].index
                );
                return hasChange ? items : prevItems;
            });
        }
    }, []);

    useEffect(() => {
        console.log("App did mount");
        fetchCSV("data/Housing.csv", (response) => {
            console.log("initial setData() ...");
            // Add index to each item for consistent identification
            const dataWithIndex = response.data.map((item, index) => ({
                ...item,
                index: index
            }));
            setData(dataWithIndex);
        });
        return () => {
            console.log("App did unmount");
        };
    }, []);

    // Define dimensions for the heatmap
    const heatmapDimensions = ['area', 'price', 'bedrooms', 'bathrooms', 'stories', 'parking'];

    return (
        <div className="App">
            <h1>Housing Data Multivariate Analysis</h1>
            <div id={"MultiviewContainer"} className={"row"}>
                <div className="col2">
                    <h2>Scatterplot (Area vs Price)</h2>
                    <ScatterplotContainer 
                        scatterplotData={data} 
                        xAttribute={"area"} 
                        yAttribute={"price"} 
                        selectedItems={selectedItems} 
                        scatterplotControllerMethods={scatterplotControllerMethods}
                    />
                </div>
                <div className="col2">
                    <h2>Correlation Heatmap</h2>
                    <HeatmapContainer 
                        heatmapData={data}
                        dimensions={heatmapDimensions}
                        selectedItems={selectedItems}
                        heatmapControllerMethods={heatmapControllerMethods}
                    />
                </div>
            </div>
            <div className="selection-info">
                <p><strong>Selected Items:</strong> {selectedItems.length} out of {data.length} total records</p>
            </div>
        </div>
    );
}

export default App;