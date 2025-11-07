import type { Form } from "../logic/Form";

const BOUNDARY_STYLES = {
  round: { fill: "#fde68a", stroke: "#b45309" },
  square: { fill: "#bfdbfe", stroke: "#1d4ed8" },
  angle: { fill: "#e9d5ff", stroke: "#7c3aed" },
  atom: { fill: "#fecdd3", stroke: "#be123c" },
};

const CHILD_POSITIONS = [
  { x: 32, y: 18 },
  { x: 48, y: 18 },
  { x: 32, y: 32 },
  { x: 48, y: 32 },
];

const CHILD_SIZE = 6;

type FormPreviewProps = {
  form: Form;
  highlight?: boolean;
};

export function FormPreview({ form, highlight }: FormPreviewProps) {
  const style = BOUNDARY_STYLES[form.boundary] ?? BOUNDARY_STYLES.round;
  const children = [...form.children].slice(0, CHILD_POSITIONS.length);

  return (
    <svg
      width={80}
      height={48}
      viewBox="0 0 80 48"
      className="selection-form-preview"
      aria-hidden
    >
      {renderBoundaryShape(form.boundary, style)}
      {children.map((child, index) => (
        <g key={child.id}>{renderChildIcon(child.boundary, index)}</g>
      ))}
      {highlight ? (
        <text
          x={64}
          y={10}
          fontSize={14}
          fontWeight={700}
          fill="#dc2626"
        >
          *
        </text>
      ) : null}
    </svg>
  );
}

function renderBoundaryShape(
  boundary: Form["boundary"],
  style: { fill: string; stroke: string },
) {
  switch (boundary) {
    case "square":
      return (
        <rect
          x={14}
          y={8}
          width={52}
          height={32}
          rx={6}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={2}
        />
      );
    case "angle":
      return (
        <polygon
          points="20,6 64,24 20,42"
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={2}
        />
      );
    case "atom":
      return (
        <circle
          cx={40}
          cy={24}
          r={10}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={2}
        />
      );
    case "round":
    default:
      return (
        <circle
          cx={40}
          cy={24}
          r={20}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={2}
        />
      );
  }
}

function renderChildIcon(boundary: Form["boundary"], positionIndex: number) {
  const { x, y } = CHILD_POSITIONS[positionIndex] ?? CHILD_POSITIONS[0];
  const style = BOUNDARY_STYLES[boundary] ?? BOUNDARY_STYLES.atom;

  switch (boundary) {
    case "square":
      return (
        <rect
          x={x - CHILD_SIZE}
          y={y - CHILD_SIZE}
          width={CHILD_SIZE * 2}
          height={CHILD_SIZE * 2}
          rx={2}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={1}
        />
      );
    case "angle":
      return (
        <polygon
          points={`${x},${y - CHILD_SIZE} ${x + CHILD_SIZE},${y} ${x},${y + CHILD_SIZE}`}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={1}
        />
      );
    case "round":
    default:
      return (
        <circle
          cx={x}
          cy={y}
          r={CHILD_SIZE}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={1}
        />
      );
  }
}
