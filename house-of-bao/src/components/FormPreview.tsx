import type { Form } from "../logic/Form";

const BOUNDARY_STYLES = {
  round: { fill: "#fde68a", stroke: "#b45309", stripe: "#f97316" },
  square: { fill: "#bfdbfe", stroke: "#1d4ed8", stripe: "#2563eb" },
  angle: { fill: "#e9d5ff", stroke: "#7c3aed", stripe: "#9333ea" },
  atom: { fill: "#fecdd3", stroke: "#be123c", stripe: "#db2777" },
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
      <defs>
        {highlight ? (
          <pattern
            id={`preview-stripes-${form.id}`}
            width={6}
            height={6}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width={6} height={6} fill={style.fill} />
            <rect width={3} height={6} fill={style.stripe} />
          </pattern>
        ) : null}
      </defs>
      {renderBoundaryShape(form.boundary, style, highlight ? `url(#preview-stripes-${form.id})` : style.fill)}
      {children.map((child, index) => (
        <g key={child.id}>{renderChildIcon(child.boundary, index)}</g>
      ))}
    </svg>
  );
}

function renderBoundaryShape(
  boundary: Form["boundary"],
  style: { fill: string; stroke: string },
  fillOverride?: string,
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
          fill={fillOverride ?? style.fill}
          stroke={style.stroke}
          strokeWidth={2}
        />
      );
    case "angle":
      return (
        <polygon
          points="20,6 64,24 20,42"
          fill={fillOverride ?? style.fill}
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
          fill={fillOverride ?? style.fill}
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
          fill={fillOverride ?? style.fill}
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
