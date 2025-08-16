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

// =========================================================================================
// STEP 1: Define the custom node. It will receive its id and data props from React Flow.
// The `data` prop will contain the functions we pass to it later.
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

// =========================================================================================
// STEP 2: Register our custom node type.
// =========================================================================================
const nodeTypes = {
  editable: EditableNode,
};

// We define initial nodes outside, but they won't have the handler functions yet.
// We will add them dynamically inside the main component.
const initialNodes = [
  {
    id: "1",
    type: "editable",
    position: { x: 50, y: 50 },
    data: { label: "Node 1" },
  },
  {
    id: "2",
    type: "editable",
    position: { x: 400, y: 50 },
    data: { label: "Node 2" },
  },
];

const initialEdges = [];

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

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
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
  return (
    <ReactFlowProvider>
      <div className="flow-container" style={{ height: "100vh" }}>
        <Flow />
        <TutorialPanel />
      </div>
    </ReactFlowProvider>
  );
}
