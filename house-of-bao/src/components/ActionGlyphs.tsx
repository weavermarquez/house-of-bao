import type { JSX } from "react";
import type { OperationKey } from "../hooks/useAvailableOperations";

type GlyphProps = {
  className?: string;
};

type ActionMetadata = {
  label: string;
  hint: string;
  description: string;
  Glyph: (props: GlyphProps) => JSX.Element;
};

const VIEWBOX_WIDTH = 148;
const VIEWBOX_HEIGHT = 48;
const MID_Y = VIEWBOX_HEIGHT / 2;

const LEFT_CENTER_X = 25;
const RIGHT_CENTER_X = 100;
const ARROW_FROM_X = 50;
const ARROW_TO_X = 70;

const colors = {
  roundFill: "#fde68a",
  roundStroke: "#b45309",
  squareFill: "#bfdbfe",
  squareStroke: "#1d4ed8",
  angleFill: "#e9d5ff",
  angleStroke: "#7c3aed",
  nodeFill: "#fcd34d",
  nodeStroke: "#a16207",
  accent: "#2563eb",
  neutral: "#94a3b8",
  voidFill: "#f8fafc",
  voidStroke: "#94a3b8",
  atomFill: "#fecdd3",
  atomStroke: "#be123c",
};

const baseSvgProps = {
  role: "presentation",
  "aria-hidden": "true",
  focusable: "false",
  width: VIEWBOX_WIDTH,
  height: VIEWBOX_HEIGHT,
  viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
} as const;

function ClarifyGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X}
        cy={MID_Y}
        r={16}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={2}
      />
      <rect
        x={LEFT_CENTER_X - 8}
        y={MID_Y - 8}
        width={16}
        height={16}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.8}
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <circle
        cx={RIGHT_CENTER_X}
        cy={MID_Y}
        r={12}
        fill={colors.voidFill}
        stroke={colors.neutral}
        strokeWidth={1.4}
        strokeDasharray="5 4"
      />
      <path
        d={`M${RIGHT_CENTER_X - 6} ${MID_Y}h12`}
        stroke={colors.neutral}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function EnfoldFrameGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X - 6}
        cy={MID_Y - 6}
        r={6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.4}
      />
      <circle
        cx={LEFT_CENTER_X + 6}
        cy={MID_Y + 6}
        r={6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.4}
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <circle
        cx={RIGHT_CENTER_X}
        cy={MID_Y}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <rect
        x={RIGHT_CENTER_X - 14}
        y={MID_Y - 14}
        width={28}
        height={28}
        rx={6}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={RIGHT_CENTER_X - 5}
        cy={MID_Y - 6}
        r={5}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.2}
      />
      <circle
        cx={RIGHT_CENTER_X + 5}
        cy={MID_Y + 6}
        r={5}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.2}
      />
    </svg>
  );
}

function EnfoldMarkGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X - 6}
        cy={MID_Y - 7}
        r={6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.2}
      />
      <circle
        cx={LEFT_CENTER_X + 6}
        cy={MID_Y + 7}
        r={6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.2}
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <rect
        x={RIGHT_CENTER_X - 16}
        y={MID_Y - 16}
        width={32}
        height={33}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={RIGHT_CENTER_X}
        cy={MID_Y}
        r={15}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={RIGHT_CENTER_X - 5}
        cy={MID_Y - 4}
        r={4.8}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.2}
      />
      <circle
        cx={RIGHT_CENTER_X + 5}
        cy={MID_Y + 4}
        r={4.8}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.2}
      />
    </svg>
  );
}

function DisperseGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X}
        cy={MID_Y}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <rect
        x={LEFT_CENTER_X - 12}
        y={MID_Y - 12}
        width={24}
        height={24}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={LEFT_CENTER_X - 4}
        cy={MID_Y - 5}
        r={4.6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1}
      />
      <circle
        cx={LEFT_CENTER_X + 4}
        cy={MID_Y + 5}
        r={4.6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1}
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <circle
        cx={RIGHT_CENTER_X - 12}
        cy={MID_Y - 6}
        r={11}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={RIGHT_CENTER_X - 18}
        y={MID_Y - 12}
        width={12}
        height={12}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.3}
      />
      <circle
        cx={RIGHT_CENTER_X - 12}
        cy={MID_Y - 6}
        r={3.2}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={0.9}
      />
      <circle
        cx={RIGHT_CENTER_X + 6}
        cy={MID_Y + 6}
        r={11}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={RIGHT_CENTER_X}
        y={MID_Y + 0.5}
        width={12}
        height={12}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.3}
      />
      <circle
        cx={RIGHT_CENTER_X + 6}
        cy={MID_Y + 7}
        r={3.2}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={0.9}
      />
    </svg>
  );
}

function CollectGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X - 8}
        cy={MID_Y - 7}
        r={12}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.6}
      />
      <rect
        x={LEFT_CENTER_X - 15}
        y={MID_Y - 13}
        width={14}
        height={14}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.atomStroke}
        strokeWidth={2}
      />
      <circle
        cx={LEFT_CENTER_X - 8}
        cy={MID_Y - 6}
        r={3.2}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={0.9}
      />
      <circle
        cx={LEFT_CENTER_X + 8}
        cy={MID_Y + 7}
        r={12}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.6}
      />
      <rect
        x={LEFT_CENTER_X + 1}
        y={MID_Y}
        width={14}
        height={14}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.atomStroke}
        strokeWidth={2}
      />
      <circle
        cx={LEFT_CENTER_X + 8}
        cy={MID_Y + 8}
        r={3.2}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={0.9}
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <circle
        cx={RIGHT_CENTER_X}
        cy={MID_Y}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <rect
        x={RIGHT_CENTER_X - 12}
        y={MID_Y - 12}
        width={24}
        height={24}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={RIGHT_CENTER_X - 4}
        cy={MID_Y - 4}
        r={4.6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1}
      />
      <circle
        cx={RIGHT_CENTER_X + 4}
        cy={MID_Y + 4}
        r={4.6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1}
      />
    </svg>
  );
}

function CancelGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X - 12}
        cy={MID_Y}
        r={6}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.3}
      />
      <polygon
        points={`${LEFT_CENTER_X - 4},12 ${LEFT_CENTER_X + 22},24 ${LEFT_CENTER_X - 4},36`}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={LEFT_CENTER_X + 5}
        cy={MID_Y}
        r={5}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.3}
      />
      <line
        x1={LEFT_CENTER_X - 18}
        y1={MID_Y - 18}
        x2={LEFT_CENTER_X + 24}
        y2={MID_Y + 18}
        stroke="#ff5555"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <circle
        cx={RIGHT_CENTER_X}
        cy={MID_Y}
        r={12}
        fill={colors.voidFill}
        stroke={colors.neutral}
        strokeWidth={1.4}
        strokeDasharray="5 4"
      />
      <path
        d={`M${RIGHT_CENTER_X - 6} ${MID_Y}h12`}
        stroke={colors.neutral}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CreatePairGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={LEFT_CENTER_X}
        cy={MID_Y}
        r={12}
        fill={colors.atomFill}
        stroke={colors.atomStroke}
        strokeWidth={1.4}
        strokeDasharray="3 3"
      />
      <Arrow from={ARROW_FROM_X} to={ARROW_TO_X} />
      <circle
        cx={RIGHT_CENTER_X - 12}
        cy={MID_Y}
        r={6}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.3}
      />
      <polygon
        points={`${RIGHT_CENTER_X},12 ${RIGHT_CENTER_X + 26},24 ${RIGHT_CENTER_X},36`}
        fill={colors.angleFill}
        stroke={colors.angleStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={RIGHT_CENTER_X + 9}
        cy={MID_Y}
        r={5}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.3}
      />
    </svg>
  );
}

function Arrow({
  from,
  to,
  y = MID_Y,
  color = colors.accent,
}: {
  from: number;
  to: number;
  y?: number;
  color?: string;
}) {
  const direction = Math.sign(to - from) || 1;
  const headOffset = 8 * direction;
  const bodyEnd = to - headOffset;
  const head =
    direction === 1
      ? `M ${to - 8} ${y - 6} L ${to} ${y} L ${to - 8} ${y + 6}`
      : `M ${to + 8} ${y - 6} L ${to} ${y} L ${to + 8} ${y + 6}`;
  return (
    <>
      <line
        x1={from}
        y1={y}
        x2={bodyEnd}
        y2={y}
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d={head}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

export const ACTION_METADATA: Record<OperationKey, ActionMetadata> = {
  clarify: {
    label: "Clarify",
    hint: "Unwrap",
    description: "Remove the paired round/square wrapper from the selection.",
    Glyph: ClarifyGlyph,
  },
  enfoldFrame: {
    label: "Enfold Frame",
    hint: "Wrap ○ outside □",
    description:
      "Wrap the selection with a round exterior and square interior so it can later be clarified.",
    Glyph: EnfoldFrameGlyph,
  },
  enfoldMark: {
    label: "Enfold Mark",
    hint: "Wrap □ outside ○",
    description:
      "Wrap the selection with a square exterior and round interior shell (the inverse of Clarify).",
    Glyph: EnfoldMarkGlyph,
  },
  disperse: {
    label: "Disperse",
    hint: "Split context",
    description: "Push the surrounding round context into each child of the square frame.",
    Glyph: DisperseGlyph,
  },
  collect: {
    label: "Collect",
    hint: "Merge context",
    description: "Merge matching round contexts back into a single square frame.",
    Glyph: CollectGlyph,
  },
  cancel: {
    label: "Cancel",
    hint: "Erase pair",
    description: "Remove a form together with its angled reflection, returning to the void.",
    Glyph: CancelGlyph,
  },
  create: {
    label: "Create Pair",
    hint: "Spawn pair",
    description: "Create a form plus its angled reflection from empty space.",
    Glyph: CreatePairGlyph,
  },
};

export type ActionMetadataMap = typeof ACTION_METADATA;
