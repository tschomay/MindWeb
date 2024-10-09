// src/GraphComponent.js
import React, { useEffect, useRef } from 'react';
//import { DataSet, Network } from 'vis-network'; // Import DataSet and Network directly
import { Network } from "vis-network/peer/esm/vis-network";
import { DataSet } from "vis-data/peer/esm/vis-data"

const GraphComponent = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Define nodes and edges using the imported DataSet class
    const nodes = new DataSet([
      { id: 1, label: 'Start', color: '#FF7518', font: { color: '#FFFFFF' } }, // Halloween colors
      { id: 2, label: 'Haunted Node', color: '#551A8B', font: { color: '#FFFFFF' } }, 
      { id: 3, label: 'Spider Node', color: '#000000', font: { color: '#FFFFFF' } },
      { id: 4, label: 'Ghost Node', color: '#00FF00', font: { color: '#000000' } },
      { id: 5, label: 'End', color: '#FF7518', font: { color: '#FFFFFF' } }
    ]);

    const edges = new DataSet([
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 }
    ]);

    // Create the network
    const data = { nodes, edges };
    const options = {
      layout: {
        hierarchical: {
          direction: "UD",
          sortMethod: "directed"
        }
      },
      interaction: {
        hover: true,
        navigationButtons: true
      },
      physics: {
        enabled: true
      }
    };

    // Initialize the network using the imported Network class
    const network = new Network(containerRef.current, data, options);

    // Event listener for node interaction
    network.on('doubleClick', function (params) {
      if (params.nodes.length) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        alert(`Node ${node.label} was double-clicked!`);
        // Add expansion/collapse logic here
      }
    });

  }, []);

  return (
    <div>
      <h2>Interactive Graph</h2>
      <div style={{ height: '500px', width: '100%' }} ref={containerRef} />
    </div>
  );
};

export default GraphComponent;
