import { useMemo, type MouseEvent } from "react";

import type { Form } from "../../logic/Form";
import { buildNetworkGraph, ROOT_NODE_ID } from "./layout";
import type { NetworkGraph, NetworkNode } from "./types";

const NODE_STROKE = "#1f2937";
const NODE_STROKE_SELECTED = "#ef4444";
const NODE_STROKE_PARENT = "#38bdf8";
const NODE_FILL_ROOT = "#dbeafe";
const NODE_FILL_ROUND = "#fde68a";
const NODE_FILL_SQUARE = "#bfdbfe";
const NODE_FILL_ANGLE = "#e9d5ff";
const NODE_FILL_ATOM = "#f8fafc";
const EDGE_STROKE = "#475569";
const EDGE_WIDTH = 1.4;
const EDGE_OPACITY = 0.55;
const EDGE_STROKE_PARENT = "#38bdf8";

const greekMap: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
};

const getNodeFill = (node: NetworkNode): string => {
  switch (node.type) {
    case "root":
      return NODE_FILL_ROOT;
    case "round":
      return NODE_FILL_ROUND;
    case "square":
      return NODE_FILL_SQUARE;
    case "angle":
      return NODE_FILL_ANGLE;
    case "atom":
    default:
      return NODE_FILL_ATOM;
  }
};

const formatNodeLabel = (node: NetworkNode): string | undefined => {
  if (node.type === "root") {
    return "root";
  }
  if (!node.label) {
    return undefined;
  }
  const raw = node.label.trim();
  if (node.type === "atom") {
    const lower = raw.toLowerCase();
    if (lower in greekMap) {
      return greekMap[lower];
    }
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return undefined;
};

const expandBounds = (graph: NetworkGraph, padding = 4) => {
  if (graph.nodes.length === 0) {
    return {
      minX: -padding,
      maxX: padding,
      minY: -padding,
      maxY: padding,
      width: padding * 2,
      height: padding * 2,
    };
  }

  const xs = graph.nodes.map((node) => node.x);
  const ys = graph.nodes.map((node) => node.y);
  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding;
  const maxY = Math.max(...ys) + padding;
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(maxX - minX, padding * 2),
    height: Math.max(maxY - minY, padding * 2),
  };
};

const extendSegment = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  extension = 0.75,
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  return {
    x1: from.x - ux * extension,
    y1: from.y - uy * extension,
    x2: to.x + ux * extension,
    y2: to.y + uy * extension,
  };
};

export interface NetworkViewProps {
  forms: readonly Form[];
  selectedIds?: ReadonlySet<string>;
  selectedParentId?: string | null;
  onToggleNode?: (id: string) => void;
  onSelectParent?: (id: string | null) => void;
  onBackgroundClick?: () => void;
  className?: string;
}

export function NetworkView({
  forms,
  selectedIds,
  selectedParentId,
  onToggleNode,
  onSelectParent,
  onBackgroundClick,
  className,
}: NetworkViewProps) {
  const graph = useMemo(() => buildNetworkGraph(forms as Form[]), [forms]);
  const bounds = useMemo(() => expandBounds(graph), [graph]);
  const nodeMap = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node] as const)),
    [graph],
  );

  const selection = selectedIds ?? new Set<string>();
  const parentSelection = selectedParentId ?? null;
  const outgoingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    graph.nodes.forEach((node) => counts.set(node.id, 0));
    graph.edges.forEach((edge) => {
      counts.set(edge.from, (counts.get(edge.from) ?? 0) + 1);
    });
    return counts;
  }, [graph]);

  const danglingSegments = useMemo(() => {
    return graph.nodes
      .filter((node) => node.type !== "root")
      .filter((node) => (outgoingCounts.get(node.id) ?? 0) === 0)
      .map((node) => ({
        id: `${node.id}-dangling`,
        from: node,
        to: { x: node.x, y: node.y + 2.4 },
      }));
  }, [graph, outgoingCounts]);

  return (
    <div className={className}>
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        width="100%"
        height="100%"
        className="network-view-svg"
        onClick={() => {
          onBackgroundClick?.();
        }}
      >
        {graph.edges.map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          const { x1, y1, x2, y2 } = extendSegment(from, to, 0.35);
          const isParentEdge =
            parentSelection !== null && edge.from === parentSelection;
          return (
            <g key={edge.id} style={{ cursor: "pointer" }}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isParentEdge ? EDGE_STROKE_PARENT : EDGE_STROKE}
                strokeWidth={EDGE_WIDTH}
                strokeLinecap="round"
                strokeOpacity={EDGE_OPACITY}
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={0.9}
                strokeLinecap="round"
                onClick={(event) => {
                  event.stopPropagation();
                  const parentId = edge.from === ROOT_NODE_ID ? null : edge.from;
                  onSelectParent?.(parentId);
                }}
              />
            </g>
          );
        })}

        {danglingSegments.map((segment) => {
          const isParentEdge =
            parentSelection !== null && segment.from.id === parentSelection;
          return (
            <g key={segment.id} style={{ cursor: "pointer" }}>
              <line
                x1={segment.from.x}
                y1={segment.from.y}
                x2={segment.to.x}
                y2={segment.to.y}
                stroke={isParentEdge ? EDGE_STROKE_PARENT : EDGE_STROKE}
                strokeWidth={EDGE_WIDTH}
                strokeOpacity={0.4}
                strokeDasharray="0.2 0.5"
              />
              <line
                x1={segment.from.x}
                y1={segment.from.y}
                x2={segment.to.x}
                y2={segment.to.y}
                stroke="transparent"
                strokeWidth={0.9}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectParent?.(segment.from.id);
                }}
              />
            </g>
          );
        })}

        {graph.nodes.map((node) => {
          const fill = getNodeFill(node);
          const label = formatNodeLabel(node);
          const isSelected = selection.has(node.id);
          const isParent = parentSelection !== null && node.id === parentSelection;
          const stroke = isSelected
            ? NODE_STROKE_SELECTED
            : isParent
              ? NODE_STROKE_PARENT
              : NODE_STROKE;
          const strokeWidth =
            node.type === "root"
              ? 0.08
              : isSelected || isParent
                ? 0.14
                : 0.1;

          const handleClick = (event: MouseEvent<SVGElement>) => {
            event.stopPropagation();
            if (node.type === "root") {
              onBackgroundClick?.();
              return;
            }
            onToggleNode?.(node.id);
          };

          switch (node.type) {
            case "root":
              return (
                <g key={node.id} onClick={handleClick} style={{ cursor: "pointer" }}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={1.2}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    fill={fill}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={0.85}
                    fill={NODE_STROKE}
                    fontFamily='"Noto Serif Display", serif'
                  >
                    root
                  </text>
                </g>
              );
            case "round":
              return (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={1}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  fill={fill}
                  onClick={handleClick}
                  style={{ cursor: "pointer" }}
                />
              );
            case "square":
              return (
                <rect
                  key={node.id}
                  x={node.x - 1}
                  y={node.y - 1}
                  width={2}
                  height={2}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  fill={fill}
                  rx={0.1}
                  ry={0.1}
                  onClick={handleClick}
                  style={{ cursor: "pointer" }}
                />
              );
            case "angle":
              return (
                <polygon
                  key={node.id}
                  points={`${node.x},${node.y - 0.7} ${node.x + 0.7},${node.y} ${node.x},${node.y + 0.7} ${node.x - 0.7},${node.y}`}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  fill={fill}
                  onClick={handleClick}
                  style={{ cursor: "pointer" }}
                />
              );
            case "atom":
            default:
              return (
                <g key={node.id} onClick={handleClick} style={{ cursor: "pointer" }}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={0.55}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    fill={fill}
                  />
                  {label ? (
                    <text
                      x={node.x}
                      y={node.y + 0.02}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={0.7}
                      fill={NODE_STROKE}
                      fontFamily='"Noto Serif Display", serif'
                    >
                      {label}
                    </text>
                  ) : null}
                </g>
              );
          }
        })}
      </svg>
    </div>
  );
}
