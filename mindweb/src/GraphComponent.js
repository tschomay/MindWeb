// src/GraphComponent.js
import React, { useEffect, useRef, useState } from 'react';
//import { DataSet, Network } from 'vis-network'; // Import DataSet and Network directly
import { Network } from "vis-network/peer/esm/vis-network";
import { DataSet } from "vis-data/peer/esm/vis-data"

const GraphComponent = () => {
  const containerRef = useRef(null);
  const [network, setNetwork] = useState(null); // Store the network instance
  const expandedNodes = useRef({}); // Track expanded nodes

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
        
      // randomSeed: 42,
      // improvedLayout:true,
      // clusterThreshold: 150,
      // hierarchical: {
      //   enabled:true,
      //   levelSeparation: 150,
      //   nodeSpacing: 100,
      //   treeSpacing: 200,
      //   blockShifting: true,
      //   edgeMinimization: true,
      //   parentCentralization: true,
      //   direction: 'UD',        // UD, DU, LR, RL
      //   sortMethod: 'hubsize',  // hubsize, directed
      //   shakeTowards: 'leaves'  // roots, leaves
      // }

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
    const networkInstance = new Network(containerRef.current, data, options);
    setNetwork(networkInstance); // Save the network instance

    // Event listener for node interaction
    networkInstance.on('doubleClick', function (params) {
      if (params.nodes.length) {
        const nodeId = params.nodes[0];
        const isExpanded = expandedNodes.current[nodeId];

        if (isExpanded) {
          // If expanded, collapse the node (remove children)
          collapseNode(nodeId, nodes, edges);
        } else {
          // If not expanded, expand the node (add children)
          expandNode(nodeId, nodes, edges);
        }

        // Toggle the expanded state
        expandedNodes.current[nodeId] = !isExpanded;
      }
    });

  }, []);

  // Function to add child nodes and edges dynamically
  const expandNode = (nodeId, nodes, edges) => {
    const newNodes = [
      { id: nodeId * 10 + 1, label: `Child of ${nodeId}`, color: '#FF7518' },
      { id: nodeId * 10 + 2, label: `Another Child of ${nodeId}`, color: '#FF7518' }
    ];
    const newEdges = [
      { from: nodeId, to: nodeId * 10 + 1 },
      { from: nodeId, to: nodeId * 10 + 2 }
    ];

    nodes.add(newNodes); // Add new child nodes
    edges.add(newEdges); // Add new edges
  };


  // Function to recursively find all descendant nodes
  const findDescendants = (nodeId, edges) => {
    const descendants = [];
    const queue = [nodeId]; // Start from the current node

    while (queue.length > 0) {
      const currentNode = queue.shift();

      // Find all edges originating from the current node
      const childEdges = edges.get({
        filter: (edge) => edge.from === currentNode
      });

      childEdges.forEach(edge => {
        const childNodeId = edge.to;
        descendants.push(childNodeId);
        queue.push(childNodeId); // Add child to queue to check its children too
      });
    }

    return descendants;
  };


  // Function to remove all descendants of a node dynamically
  const collapseNode = (nodeId, nodes, edges) => {
    // Find all descendant nodes (children, grandchildren, etc.)
    const descendants = findDescendants(nodeId, edges);

    if (descendants.length > 0) {
      nodes.remove(descendants); // Remove all descendant nodes
      edges.remove(edges.get({
        filter: (edge) => descendants.includes(edge.from) || edge.from === nodeId
      })); // Remove all edges connected to descendants or the parent
    }
  };



  return (
    <div>
      <h2>Hacktoberfest 2024</h2>
      <div style={{ height: '500px', width: '100%' }} ref={containerRef} />
    </div>
  );
};

export default GraphComponent;
