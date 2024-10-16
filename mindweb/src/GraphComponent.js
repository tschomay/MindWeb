// src/GraphComponent.js
import React, { useEffect, useRef, useState } from 'react';
//import { DataSet, Network } from 'vis-network'; // Import DataSet and Network directly
import { Network } from "vis-network/peer/esm/vis-network";
import { DataSet } from "vis-data/peer/esm/vis-data"
import ReactQuill from 'react-quill'; // Import Quill editor
import 'react-quill/dist/quill.snow.css'; // Quill CSS

const GraphComponent = () => {
  const containerRef = useRef(null);
  const [network, setNetwork] = useState(null); // Store the network instance
  const [editorVisible, setEditorVisible] = useState(false); // To toggle editor visibility
  const [selectedNodeId, setSelectedNodeId] = useState(null); // Track selected node
  const [editorContent, setEditorContent] = useState(''); // Store editor content

  const nodes = useRef(null); // Reference for nodes
  const edges = useRef(null); // Reference for edges
  const expandedNodes = useRef({}); // Track expanded nodes

  useEffect(() => {
    // Define nodes and edges using the imported DataSet class
    const initialNodes = new DataSet([
      { id: 1, label: 'Start', color: '#FF7518', font: { color: '#FFFFFF' } }, // Halloween colors
      { id: 2, label: 'Haunted Node', color: '#551A8B', font: { color: '#FFFFFF' } }, 
      { id: 3, label: 'Spider Node', color: '#000000', font: { color: '#FFFFFF' } },
      { id: 4, label: 'Ghost Node', color: '#00FF00', font: { color: '#000000' } },
      { id: 5, label: 'End', color: '#FF7518', font: { color: '#FFFFFF' } }
    ]);

    const initialEdges = new DataSet([
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 2, to: 5 }
    ]);

    nodes.current = initialNodes;
    edges.current = initialEdges;

    // Set all nodes as expanded initially
    initialNodes.getIds().forEach(nodeId => {
      expandedNodes.current[nodeId] = true;
    });


    // Create the network
    const data = { nodes: initialNodes, edges: initialEdges };
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
        enabled: true,
        stabilization: {
          iterations: 1000,  // Number of stabilization iterations after any changes
          updateInterval: 25, // How often to check if stabilization is complete
        },
        solver: 'barnesHut',  // Controls how nodes repel each other
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.1,
          damping: 0.5,      // Higher damping reduces movement
          avoidOverlap: 1     // Reduces node overlap
        }
      }
    };

    // Initialize the network using the imported Network class
    const networkInstance = new Network(containerRef.current, data, options);
    setNetwork(networkInstance); // Save the network instance


    // Event listener for expanding/collapsing
    networkInstance.on('doubleClick', function (params) {
      if (params.nodes.length) {
        const nodeId = params.nodes[0];
        const isExpanded = expandedNodes.current[nodeId];

        if (isExpanded) {
          // If expanded, collapse the node (remove children)
          collapseNode(nodeId);
          networkInstance.stabilize(10);
        } else {
          // If not expanded, expand the node (add children)
          expandNode(nodeId);
          networkInstance.stabilize(10);
        }

        // Toggle the expanded state
        expandedNodes.current[nodeId] = !isExpanded;
      }
    });

    // Handle click for selecting a node
    networkInstance.on('click', (params) => {
      if (params.nodes.length) {
        const nodeId = params.nodes[0];
        setSelectedNodeId(nodeId);
      } else {
        setSelectedNodeId(null); // Clear selection when clicking outside nodes
      }
    });

    

  }, []);



  // Traverse up graph to find all nodes between an end and a start
  const findNodesBetween = (startNode, endNode) => {
    const visited = new Set();  // To track visited nodes
    const queue = [endNode];  // Queue for traversal
    const pathNodes = [];       // To store the nodes in the path
  
    while (queue.length > 0) {
      const currentNode = queue.shift();  // Dequeue the next node to process
  
      // Mark the node as visited
      if (visited.has(currentNode)) continue;
      visited.add(currentNode);
  
      // Add the current node to the path
      if ((currentNode !== startNode) && (currentNode !== endNode)) {
        pathNodes.push(currentNode);
      }
      // If we reach the start node, return the path we've found
      if (currentNode === startNode) {
        return pathNodes;
      }
  
      // Find all edges ending at the current node
      const connectedEdges = edges.current.get({
        filter: (edge) => edge.to === currentNode
      });
  
      // Add the connected nodes to the queue
      connectedEdges.forEach(edge => {
        if (!visited.has(edge.from)) {
          queue.push(edge.from);
        }
      });
    }
  
    // If no path is found, return an empty array
    return [];
  };
  

  
  // Function to hide or reveal child nodes and edges dynamically
  const expandNode = (nodeId) => {

    const descendants = findDescendants(nodeId);
    // If the node has no children, exit the function
    if (descendants.length === 0) {
      return;
    }
    const nodesToExpand = []
    descendants.forEach((descendantId) => {
      const intermediaries = findNodesBetween(nodeId, descendantId)
      if (intermediaries.map(key => expandedNodes.current[key]).every(value => value === true)){
        nodesToExpand.push(descendantId)
      }
    })
    // Remove star from node's label when expanded
    const newLabel = nodes.current.get(nodeId).label.slice(0, -1);
    nodes.current.update({
      id: nodeId,
      //font: { multi: true },
      label: `${newLabel}`
    });

    nodes.current.update(nodesToExpand.map((id) => ({ id, hidden: false })));
    edges.current.update(edges.current.get({
      filter: (edge) => nodesToExpand.includes(edge.to)
    }).map(edge => ({ ...edge, hidden: false })));
  };



  const collapseNode = (nodeId) => {
    const descendants = findDescendants(nodeId);
    // If the node has no children, exit the function
    if (descendants.length === 0) {
      return;
    }
    nodes.current.update(descendants.map((id) => ({ id, hidden: true })));
    edges.current.update(edges.current.get({
      filter: (edge) => edge.from === nodeId || descendants.includes(edge.from)
    }).map(edge => ({ ...edge, hidden: true })));
    // Add star to node's label when collapsed
    nodes.current.update({
      id: nodeId,
      //font: { multi: true },
      label: `${nodes.current.get(nodeId).label}*`
    });
  };


  // Function to recursively find all descendant nodes
  const findDescendants = (nodeId) => {
    const descendants = [];
    const queue = [nodeId]; // Start from the current node

    while (queue.length > 0) {
      const currentNode = queue.shift();
      // Find all edges originating from the current node
      const childEdges = edges.current.get({
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

  // A helper function to strip HTML tags (if necessary)
  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };
  
  // Handle saving the edited label
  const handleSave = () => {
    nodes.current.update({ id: selectedNodeId, label: stripHtml(editorContent) }); // Update the node label
    setEditorVisible(false); // Hide the editor
  };


  // Add a child node
  const handleAddChild = () => {
    const newNodeId = Math.max(...nodes.current.getIds()) + 1; // Generate a new unique node ID
    const newNode = { id: newNodeId, label: `New Child of ${selectedNodeId}`, color: '#FF7518' };
    const newEdge = { from: selectedNodeId, to: newNodeId };

    nodes.current.add(newNode);
    edges.current.add(newEdge);
    expandedNodes.current[newNodeId] = true;
  };



  // Remove selected node and its descendants from the dataset (proper removal)
  const handleRemoveNode = () => {
    if (selectedNodeId) {
      const descendants = findDescendants(selectedNodeId);
      
      // Fully remove nodes and edges, so they won't reappear
      nodes.current.remove([...descendants, selectedNodeId]);
      edges.current.remove(edges.current.get({
        filter: (edge) => edge.to === selectedNodeId || descendants.includes(edge.from)
      }));

      // Remove the node from expandedNodes to avoid it being expanded again
      delete expandedNodes.current[selectedNodeId];
      descendants.forEach((descendant) => delete expandedNodes.current[descendant]);



      setSelectedNodeId(null); // Clear selection after removing
    }
  };

  // Import/export
  // Function to export the graph state
  const exportGraph = () => {
    console.log("Export clicked")
    const exportedData = {
      nodes: nodes.current.get(),   // Get all the nodes
      edges: edges.current.get()    // Get all the edges
    };

    // Convert the data to JSON string
    const jsonData = JSON.stringify(exportedData, null, 2);

    // Create a blob and download the JSON file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to import the graph state
const importGraph = (event) => {
  const file = event.target.files[0]; // Get the uploaded file
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const importedData = JSON.parse(content);

    // Clear the existing nodes and edges
    nodes.current.clear();
    edges.current.clear();

    // Load the imported nodes and edges
    nodes.current.add(importedData.nodes);
    edges.current.add(importedData.edges);
  };

  // Read the file content as a string
  reader.readAsText(file);
};




  return (
    <div>
      <h2>Hacktoberfest 2024</h2>

      {/* Node control buttons */}
      <div className="import-export">
        <button onClick={exportGraph}>Export Web</button>

        {/* Hidden file input for importing */}
        <input 
          type="file" 
          id="importFile" 
          accept=".json" 
          style={{ display: 'none' }} 
          onChange={importGraph} 
        />
        {/* Button to trigger the file input */}
        <button onClick={() => document.getElementById('importFile').click()}>Import Web</button>
    
      </div>


      <div style={{ height: '500px', width: '100%' }} ref={containerRef} />

      {/* Node control buttons */}
      {selectedNodeId && (
        <div className="node-actions">
          <button onClick={() => setEditorVisible(true)}>Edit Node Text</button>
          <button onClick={handleAddChild}>Add Child</button>
          <button onClick={handleRemoveNode}>Remove Node</button>
        </div>
      )}

      {editorVisible && (
        <div className="editor-modal">
          <ReactQuill theme="snow" value={editorContent} onChange={setEditorContent} />
          <button onClick={handleSave}>Save</button>
        </div>
      )}


      {/* {selectedNodeId && nodes.current.get(selectedNodeId) && (
        <div
          className="node-label"
          dangerouslySetInnerHTML={{ __html: nodes.current.get(selectedNodeId).label }}
        />
      )} */}

    </div>
  );
};

export default GraphComponent;
