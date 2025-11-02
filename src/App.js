import './App.css';
import {useState, useEffect, useCallback} from 'react'
import {fetchCSV} from "./utils/helper";
import ScatterplotContainer from "./components/scatterplot/ScatterplotContainer";

function App() {
    console.log("App component function call...")
    const [data, setData] = useState([])
    const [selectedItems, setSelectedItems] = useState([])

    // Memoize the controller methods to prevent unnecessary re-renders
    const scatterplotControllerMethods = useCallback({
        updateSelectedItems: (items) => {
            console.log("Updating selected items:", items);
            // Only update if the selection actually changed
            setSelectedItems(prevItems => {
                // Simple comparison - if lengths are different, definitely update
                if (prevItems.length !== items.length) {
                    return items;
                }
                // If lengths are same, check if any item is different
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
            console.log("initial setData() ...")
            // Add index to each item for consistent identification
            const dataWithIndex = response.data.map((item, index) => ({
                ...item,
                index: index
            }));
            setData(dataWithIndex);
        })
        return () => {
            console.log("App did unmount");
        }
    }, [])

    return (
        <div className="App">
            <div id={"MultiviewContainer"} className={"row"}>
                <ScatterplotContainer 
                    scatterplotData={data} 
                    xAttribute={"area"} 
                    yAttribute={"price"} 
                    selectedItems={selectedItems} 
                    scatterplotControllerMethods={scatterplotControllerMethods}
                />
            </div>
        </div>
    );
}

export default App;