import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Handle,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import { getContrastColor } from "./utils/colorUtils";

// =========================================================================================
// CUSTOM NODE: EditableNode supports in-place label editing and applies contrast-aware text color.
// - Props: id (string), data: { label, isEditing, onLabelChange, setEditing }
// =========================================================================================
function EditableNode({ id, data }) {
  // This function is called when the input value changes.
  const handleInputChange = (e) => {
    // It calls the `onLabelChange` function that was passed in `data`.
    data.onLabelChange(id, e.target.value);
  };

  // This function is called when a key is pressed in the input.
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // When the Enter key is pressed, we call `setEditing` to false.
      data.setEditing(false);
    }
  };

  return (
    <div style={{ padding: "10px 15px", borderRadius: "8px" }}>
      <Handle type="source" position="top" id="top" />
      <Handle type="source" position="right" id="right" />
      {data.isEditing ? (
        <input
          type="text"
          value={data.label}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          // When the input loses focus (the user clicks away), we stop editing.
          onBlur={() => data.setEditing(false)}
          autoFocus // Automatically focus the input when it appears.
        />
      ) : (
        // When not editing, just display the label.
        <span>{data.label}</span>
      )}
      <Handle type="source" position="bottom" id="bottom" />
      <Handle type="source" position="left" id="left" />
    </div>
  );
}

// Register custom node types so React Flow can render your EditableNode component.
const nodeTypes = {
  editable: EditableNode,
};

// Initial node definitions: these nodes appear on load or when no saved state exists.
const initialNodes = [
  // Node 1 at top-left
  {
    id: "1",
    type: "editable",
    position: { x: 50, y: 50 },
    data: { label: "Node 1" },
  },
  // Node 2 to the right of Node 1
  {
    id: "2",
    type: "editable",
    position: { x: 400, y: 50 },
    data: { label: "Node 2" },
  },
];

// Empty edge list by default; new connections will populate this.
const initialEdges = [];

// Flow component: handles rendering the graph, node/edge state, persistence, and user interactions.
function Flow() {
  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem("flow-history");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          return parsedHistory;
        }
      }
    } catch (error) {
      console.error("Failed to load history from localStorage ", error);
    }

    return [{ nodes: initialNodes, edges: initialEdges }];
  });

  const [historyIndex, setHistoryIndex] = useState(() => {
    try {
      const savedHistoryIndex = localStorage.getItem("flow-history-index");
      if (savedHistoryIndex) {
        const parsedHistoryIndex = JSON.parse(savedHistoryIndex);

        if (typeof parsedHistoryIndex === "number") {
          return parsedHistoryIndex;
        }
      }
    } catch (error) {
      console.error("Failed to load history index from localStorage ", error);
    }

    return 0;
  });

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const currentNodes = history[historyIndex].nodes;
  const currentEdges = history[historyIndex].edges;

  const reactFlowInstance = useReactFlow();

  // This ref helps distinguish between internal React Flow changes (drag, select) and explicit changes (add, delete).
  const isInternalChange = useRef(false);

  // This effect resets the flag after a state update.
  useEffect(() => {
    isInternalChange.current = false;
  });

  const [selectedNodes, setSelectedNodes] = useState([]);

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodes(nodes);
  }, []);

  const recordChange = useCallback(
    ({ newNodes, newEdges }) => {
      const pastHistory = history.slice(0, historyIndex + 1);
      const present = { nodes: newNodes, edges: newEdges };
      const newHistory = [...pastHistory, present];

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const onAddNode = useCallback(() => {
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    const centerPosition = reactFlowInstance.screenToFlowPosition({
      x: screenCenterX,
      y: screenCenterY,
    });

    const newNode = {
      id: new Date().getTime().toString(),
      type: "editable",
      position: centerPosition,
      data: { label: "New Node", isEditing: false },
    };

    const newNodes = [...currentNodes, newNode];
    const newEdges = currentEdges;

    recordChange({ newNodes, newEdges });
  }, [reactFlowInstance, currentNodes, currentEdges, recordChange]);

  const onNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, currentNodes);

      // For internal changes (like dragging), we update the current history state
      // without creating a new entry. This prevents polluting the history.
      if (isInternalChange.current) {
        const currentHistory = [...history];
        currentHistory[historyIndex] = {
          ...currentHistory[historyIndex],
          nodes: newNodes,
        };
        setHistory(currentHistory);
      } else {
        // For explicit changes, we record a new history entry.
        recordChange({ newNodes, newEdges: currentEdges });
      }
      // We set this flag before the next render cycle.
      isInternalChange.current = true;
    },
    [currentNodes, currentEdges, history, historyIndex, recordChange]
  );

  const onNodeColorChange = useCallback(
    (nodeId, newColor) => {
      const textColor = getContrastColor(newColor);

      const newNodes = currentNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            style: {
              ...node.style,
              backgroundColor: newColor,
              color: textColor,
            },
          };
        }
        return node;
      });

      const newEdges = currentEdges;

      recordChange({ newNodes, newEdges });
    },
    [currentNodes, currentEdges, recordChange]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const newEdges = applyEdgeChanges(changes, currentEdges);

      // Similar to onNodesChange, we update the current history state for internal changes.
      if (isInternalChange.current) {
        const currentHistory = [...history];
        currentHistory[historyIndex] = {
          ...currentHistory[historyIndex],
          edges: newEdges,
        };
        setHistory(currentHistory);
      } else {
        recordChange({ newNodes: currentNodes, newEdges });
      }
      isInternalChange.current = true;
    },
    [currentNodes, currentEdges, history, historyIndex, recordChange]
  );

  const onConnect = useCallback(
    (connection) => {
      const newEdges = addEdge(connection, currentEdges);
      recordChange({ newNodes: currentNodes, newEdges });
    },
    [currentNodes, currentEdges, recordChange]
  );

  const onDeleteNode = useCallback(() => {
    const idsToDelete = selectedNodes.map((node) => node.id);

    const newNodes = currentNodes.filter(
      (node) => !idsToDelete.includes(node.id)
    );

    const newEdges = currentEdges.filter(
      (edge) =>
        !idsToDelete.includes(edge.source) && !idsToDelete.includes(edge.target)
    );

    recordChange({ newNodes, newEdges });
    setSelectedNodes([]);
  }, [selectedNodes, currentNodes, currentEdges, recordChange]);

  // =========================================================================================
  // STEP 3: Create the handler functions that will be passed to the nodes.
  // We use useCallback to prevent these functions from being recreated on every render.
  // =========================================================================================

  // This function updates the label of a specific node.
  const onNodeLabelChange = useCallback(
    (id, newLabel) => {
      const newNodes = currentNodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      });

      // Directly update the current history state for label changes.
      const currentHistory = [...history];
      currentHistory[historyIndex] = {
        ...currentHistory[historyIndex],
        nodes: newNodes,
      };
      setHistory(currentHistory);
    },
    [currentNodes, history, historyIndex]
  );

  // This function sets the `isEditing` flag for a specific node.
  const setNodeEditing = useCallback(
    (id, isEditing) => {
      const newNodes = currentNodes.map((node) => {
        if (node.id === id) {
          // Set the editing flag for the target node
          return { ...node, data: { ...node.data, isEditing } };
        }
        // Important: Also set all other nodes to NOT be editing
        return { ...node, data: { ...node.data, isEditing: false } };
      });

      // Directly update the current history state for editing changes.
      const currentHistory = [...history];
      currentHistory[historyIndex] = {
        ...currentHistory[historyIndex],
        nodes: newNodes,
      };
      setHistory(currentHistory);
    },
    [currentNodes, history, historyIndex]
  );

  // This handler is called when a node is double-clicked.
  const handleNodeDoubleClick = useCallback(
    (event, node) => {
      event.stopPropagation(); // Prevent the pane double-click from firing
      setNodeEditing(node.id, true);
    },
    [setNodeEditing]
  );

  // This handler is called when the pane is double-clicked.
  const onPaneDoubleClick = useCallback(
    (event) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: new Date().getTime().toString(),
        type: "editable",
        position,
        data: { label: "New Node", isEditing: false },
      };
      const newNodes = [...currentNodes, newNode];

      recordChange({ newNodes, newEdges: currentEdges });
    },
    [reactFlowInstance, currentNodes, currentEdges, recordChange]
  );

  const onImport = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target.result;
        try {
          const data = JSON.parse(text);
          // Basic validation: check if nodes and edges exist
          if (data && data.nodes && data.edges) {
            setHistory([{ nodes: data.nodes, edges: data.edges }]);
            setHistoryIndex(0);
          } else {
            alert("Invalid map file.");
          }
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          alert("Could not import map. The file may be corrupted.");
        }
      };

      reader.readAsText(file);

      event.target.value = null;
    },
    [setHistory, setHistoryIndex]
  );

  const onExport = useCallback(() => {
    const dataToSave = { nodes: currentNodes, edges: currentEdges };
    const jsonString = JSON.stringify(dataToSave, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "stacksense-map.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentNodes, currentEdges]);

  // =========================================================================================
  // STEP 4: Dynamically add the handler functions to each node's data object.
  // This is the magic step that makes the handlers available inside the custom node.
  // =========================================================================================
  const nodesWithHandlers = useMemo(() => {
    return currentNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: onNodeLabelChange,
        setEditing: (isEditing) => setNodeEditing(node.id, isEditing),
      },
    }));
  }, [currentNodes, onNodeLabelChange, setNodeEditing]);

  // This effect persists the history state to localStorage.
  useEffect(() => {
    localStorage.setItem("flow-history", JSON.stringify(history));
    localStorage.setItem("flow-history-index", JSON.stringify(historyIndex));
  }, [history, historyIndex]);

  const onUndo = useCallback(() => {
    if (historyIndex <= 0) {
      return; // Prevent going below the first index
    }
    setHistoryIndex(historyIndex - 1); // Decrement the history index
  }, [historyIndex]);

  const onRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) {
      return; // Prevent going out of bounds
    }
    setHistoryIndex(historyIndex + 1); // Increment the history index
  }, [historyIndex, history.length]);

  return (
    <div style={{ height: "100%" }}>
      <ReactFlow
        nodes={nodesWithHandlers} // CHANGED: Use the nodes with injected handlers
        edges={currentEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick} // CHANGED: Renamed for clarity
        onPaneDoubleClick={onPaneDoubleClick} // CHANGED: Use the specific pane handler
        zoomOnDoubleClick={false}
        onDoubleClick={onPaneDoubleClick}
        connectionMode="loose"
        isValidConnection={() => true}
        onSelectionChange={onSelectionChange}
        defaultEdgeOptions={{
          animated: false,
          // style: { stroke: '#C5C5C5' }, // A nice light gray for the edge
          markerEnd: {
            type: "arrowclosed",
            color: "#C5C5C5",
          },
        }}
      >
        <Background />
      </ReactFlow>
      {selectedNodes.length === 1 && (
        <Sidebar
          key={selectedNodes[0].id}
          selectedNode={selectedNodes[0]}
          onLabelChange={onNodeLabelChange}
          onNodeColorChange={onNodeColorChange}
        />
      )}
      <Toolbar
        onAddNode={onAddNode}
        onDeleteNode={onDeleteNode}
        onImport={onImport}
        onExport={onExport}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}

function TutorialPanel() {
  return (
    <div className="tutorial-container">
      <p>Instructions:</p>
      <ul>
        <li>Double click the pane to add a new node.</li>
        <li>Select a node/edge and press backspace to delete it.</li>
        <li>Double click a node to edit its content.</li>
      </ul>
    </div>
  );
}

export default function App() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);

  const toggleTutorialPane = () => {
    setIsTutorialOpen(!isTutorialOpen);
  };

  return (
    <ReactFlowProvider>
      <div className="flow-container" style={{ height: "100vh" }}>
        <Flow />
        <button className="help-button" onClick={toggleTutorialPane}>
          ?
        </button>
        {isTutorialOpen && <TutorialPanel />}
      </div>
    </ReactFlowProvider>
  );
}
