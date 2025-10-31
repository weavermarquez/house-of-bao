import type { BoundaryType, Form } from "../../logic/Form";
import type { NetworkEdge, NetworkGraph, NetworkNode } from "./types";

const NODE_BASE_SIZE = 1;
const VERTICAL_GAP = 4;
const HORIZONTAL_GAP = 3.25;
export const ROOT_NODE_ID = "__root__";

type NormalizedForm = {
  id: string;
  boundary: BoundaryType;
  label?: string;
  children: NormalizedForm[];
};

type LayoutTree = {
  node: NormalizedForm | null;
  depth: number;
  children: LayoutTree[];
  width: number;
  x: number;
};

const normalizeForm = (form: Form): NormalizedForm => ({
  id: form.id,
  boundary: form.boundary,
  label: form.label,
  children: Array.from(form.children, normalizeForm),
});

const buildTree = (node: NormalizedForm, depth: number): LayoutTree => {
  const childTrees = node.children.map((child) => buildTree(child, depth + 1));
  return {
    node,
    depth,
    children: childTrees,
    width: 1,
    x: 0,
  };
};

const buildForestTree = (forms: NormalizedForm[]): LayoutTree => ({
  node: null,
  depth: 0,
  children: forms.map((form) => buildTree(form, 0)),
  width: 1,
  x: 0,
});

const computeWidths = (tree: LayoutTree): number => {
  const childWidths = tree.children.map((child) => computeWidths(child));
  const width =
    childWidths.length > 0
      ? Math.max(childWidths.reduce((sum, value) => sum + value, 0), 1)
      : 1;
  tree.width = width;
  return width;
};

const assignPositions = (tree: LayoutTree, startX: number): void => {
  const center = startX + tree.width / 2;
  tree.x = center;

  let offset = startX;
  for (const child of tree.children) {
    assignPositions(child, offset);
    offset += child.width;
  }
};

const collectNodesAndEdges = (
  tree: LayoutTree,
  nodes: Map<string, NetworkNode>,
  edges: NetworkEdge[],
  parent?: LayoutTree,
) => {
  if (tree.node) {
    const id = tree.node.id;
    const type = tree.node.boundary;
    const existing = nodes.get(id);
    const x = tree.x * HORIZONTAL_GAP;
    const y = tree.depth * VERTICAL_GAP;

    if (!existing) {
      nodes.set(id, {
        id,
        type,
        label: tree.node.label,
        depth: tree.depth,
        x,
        y,
      });
    }

    if (parent?.node) {
      const parentId = parent.node.id;
      edges.push({
        id: `${parentId}->${id}-${edges.length}`,
        from: parentId,
        to: id,
      });
    }
  }

  for (const child of tree.children) {
    const edgeParent = tree.node ? tree : parent;
    collectNodesAndEdges(child, nodes, edges, edgeParent ?? tree);
  }
};

const getPrimaryNodeId = (branch: LayoutTree): string | undefined => {
  if (branch.node) {
    return branch.node.id;
  }
  for (const child of branch.children) {
    const result = getPrimaryNodeId(child);
    if (result) {
      return result;
    }
  }
  return undefined;
};

export const buildNetworkGraph = (forms: Form[]): NetworkGraph => {
  const normalized = forms.map(normalizeForm);
  const tree = buildForestTree(normalized);
  computeWidths(tree);
  assignPositions(tree, 0);

  const nodes = new Map<string, NetworkNode>();
  const edges: NetworkEdge[] = [];
  collectNodesAndEdges(tree, nodes, edges);

  const rootNode: NetworkNode = {
    id: ROOT_NODE_ID,
    type: "root",
    label: "root",
    depth: -1,
    x: tree.x * HORIZONTAL_GAP,
    y: -VERTICAL_GAP,
  };
  nodes.set(ROOT_NODE_ID, rootNode);

  const rootEdgeKeys = new Set<string>();
  for (const child of tree.children) {
    const targetId = getPrimaryNodeId(child);
    if (!targetId) continue;
    const edgeKey = `${ROOT_NODE_ID}->${targetId}`;
    if (rootEdgeKeys.has(edgeKey)) continue;
    rootEdgeKeys.add(edgeKey);
    edges.push({
      id: `${edgeKey}-${edges.length}`,
      from: ROOT_NODE_ID,
      to: targetId,
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
};

export { NODE_BASE_SIZE };
