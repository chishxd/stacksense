import { useState, useCallback, useEffect, useMemo } from "react";
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
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes] = useState(() => {
    if (localStorage.getItem("flow-nodes")) {
      return JSON.parse(localStorage.getItem("flow-nodes"));
    }
    return initialNodes;
  });

  const [edges, setEdges] = useState(() => {
    if (localStorage.getItem("flow-edges")) {
      return JSON.parse(localStorage.getItem("flow-edges"));
    }
    return initialEdges;
  });

  const [selectedNodes, setSelectedNodes] = useState([]);

  const onSelectionChange = useCallback(({ nodes, edges }) => {
    // We only care about the nodes for now
    setSelectedNodes(nodes);
  }, []);

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
      data: { label: "New Node", isEditing: true },
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
  }, [reactFlowInstance, nodes]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onNodeColorChange = useCallback(
    (nodeId, newColor) => {
      const textColor = getContrastColor(newColor);

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
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
        })
      );
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDeleteNode = useCallback(() => {
    const idsToDelete = selectedNodes.map((node) => node.id);

    setNodes((currentNodes) =>
      currentNodes.filter((node) => !idsToDelete.includes(node.id))
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          !idsToDelete.includes(edge.source) &&
          !idsToDelete.includes(edge.target)
      )
    );

    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges]);

  // =========================================================================================
  // STEP 3: Create the handler functions that will be passed to the nodes.
  // We use useCallback to prevent these functions from being recreated on every render.
  // =========================================================================================

  // This function updates the label of a specific node.
  const onNodeLabelChange = useCallback(
    (id, newLabel) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // This function sets the `isEditing` flag for a specific node.
  const setNodeEditing = useCallback(
    (id, isEditing) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === id) {
            // Set the editing flag for the target node
            return { ...node, data: { ...node.data, isEditing } };
          }
          // Important: Also set all other nodes to NOT be editing
          return { ...node, data: { ...node.data, isEditing: false } };
        })
      );
    },
    [setNodes]
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
        data: { label: "New Node", isEditing: true },
      };
      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [reactFlowInstance, nodes]
  );

  const onExport = useCallback(() => {
    const dataToSave = { nodes, edges };
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
  }, [nodes, edges]);

  // =========================================================================================
  // STEP 4: Dynamically add the handler functions to each node's data object.
  // This is the magic step that makes the handlers available inside the custom node.
  // =========================================================================================
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: onNodeLabelChange,
        setEditing: (isEditing) => setNodeEditing(node.id, isEditing),
      },
    }));
  }, [nodes, onNodeLabelChange, setNodeEditing]);

  useEffect(() => {
    localStorage.setItem("flow-nodes", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("flow-edges", JSON.stringify(edges));
  }, [edges]);

  const loadLocalStorage = () => {
    let nodes = localStorage.getItem("flow-nodes");
    let edges = localStorage.getItem("flow-edges");

    if (nodes == null) {
      return initialNodes;
    } else if (edges == null) {
      return [];
    }
    return JSON.parse(nodes), JSON.parse(edges);
  };

  return (
    <div style={{ height: "100%" }}>
      <ReactFlow
        nodes={nodesWithHandlers} // CHANGED: Use the nodes with injected handlers
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick} // CHANGED: Renamed for clarity
        onPaneDoubleClick={onPaneDoubleClick} // CHANGED: Use the specific pane handler
        zoomOnDoubleClick={false} // This is correct, we disabled it for our custom action
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
        onExport={onExport}
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
