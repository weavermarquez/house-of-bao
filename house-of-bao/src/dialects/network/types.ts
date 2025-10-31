import type { BoundaryType, Form } from "../../logic/Form";

export type NetworkNodeType = "root" | BoundaryType;

export type NetworkNode = {
  id: string;
  type: NetworkNodeType;
  label?: string;
  depth: number;
  x: number;
  y: number;
};

export type NetworkEdge = {
  id: string;
  from: string;
  to: string;
};

export type NetworkGraph = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

export type FormForest = readonly Form[];
