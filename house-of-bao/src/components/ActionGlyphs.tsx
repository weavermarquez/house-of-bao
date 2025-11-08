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
        cx={36}
        cy={MID_Y}
        r={17}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <rect
        x={24}
        y={MID_Y - 11}
        width={24}
        height={22}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={36}
        cy={MID_Y}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.6}
      />
      <Arrow from={64} to={92} />
      <circle
        cx={112}
        cy={MID_Y}
        r={8}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.6}
      />
    </svg>
  );
}

function EnfoldFrameGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={40}
        cy={MID_Y - 6}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.4}
      />
      <circle
        cx={52}
        cy={MID_Y + 6}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.4}
      />
      <Arrow from={70} to={94} />
      <circle
        cx={112}
        cy={MID_Y}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <rect
        x={98}
        y={MID_Y - 14}
        width={28}
        height={28}
        rx={6}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={108}
        cy={MID_Y - 6}
        r={5}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.2}
      />
      <circle
        cx={120}
        cy={MID_Y + 6}
        r={5}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.2}
      />
    </svg>
  );
}

function EnfoldMarkGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={40}
        cy={MID_Y - 7}
        r={5}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.2}
      />
      <circle
        cx={40}
        cy={MID_Y + 7}
        r={5}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.2}
      />
      <Arrow from={72} to={96} />
      <rect
        x={98}
        y={MID_Y - 16}
        width={32}
        height={32}
        rx={8}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={114}
        cy={MID_Y}
        r={16}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={106}
        cy={MID_Y - 4}
        r={4.8}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.2}
      />
      <circle
        cx={122}
        cy={MID_Y + 4}
        r={4.8}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.2}
      />
    </svg>
  );
}

function DisperseGlyph({ className }: GlyphProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle
        cx={34}
        cy={MID_Y}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <rect
        x={22}
        y={MID_Y - 12}
        width={24}
        height={24}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={30}
        cy={MID_Y - 5}
        r={4.6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1}
      />
      <circle
        cx={38}
        cy={MID_Y + 5}
        r={4.6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1}
      />
      <Arrow from={64} to={94} />
      <circle
        cx={104}
        cy={MID_Y - 6}
        r={13}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={97}
        y={MID_Y - 12}
        width={14}
        height={14}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.3}
      />
      <circle
        cx={104}
        cy={MID_Y - 6}
        r={3.2}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={0.9}
      />
      <circle
        cx={128}
        cy={MID_Y + 6}
        r={13}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={121}
        y={MID_Y + 0.5}
        width={14}
        height={14}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.3}
      />
      <circle
        cx={128}
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
        cx={32}
        cy={MID_Y - 7}
        r={13}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={25}
        y={MID_Y - 13}
        width={14}
        height={14}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.3}
      />
      <circle
        cx={32}
        cy={MID_Y - 6}
        r={3.2}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={0.9}
      />
      <circle
        cx={48}
        cy={MID_Y + 7}
        r={13}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={41}
        y={MID_Y + 1}
        width={14}
        height={14}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.3}
      />
      <circle
        cx={48}
        cy={MID_Y + 8}
        r={3.2}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={0.9}
      />
      <Arrow from={72} to={100} />
      <circle
        cx={118}
        cy={MID_Y}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <rect
        x={106}
        y={MID_Y - 12}
        width={24}
        height={24}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={112}
        cy={MID_Y - 4}
        r={4.6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1}
      />
      <circle
        cx={124}
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
        cx={34}
        cy={MID_Y}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.3}
      />
      <polygon
        points="58,12 80,24 58,36"
        fill={colors.angleFill}
        stroke={colors.angleStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={66}
        cy={MID_Y}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.3}
      />
      <line
        x1={32}
        y1={MID_Y - 18}
        x2={74}
        y2={MID_Y + 18}
        stroke="#dc2626"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <Arrow from={92} to={120} />
      <circle
        cx={122}
        cy={MID_Y}
        r={12}
        fill={colors.voidFill}
        stroke={colors.neutral}
        strokeWidth={1.4}
        strokeDasharray="5 4"
      />
      <path
        d={`M${122 - 6} ${MID_Y}h12`}
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
        cx={32}
        cy={MID_Y}
        r={12}
        fill={colors.voidFill}
        stroke={colors.neutral}
        strokeWidth={1.4}
        strokeDasharray="4 3"
      />
      <path
        d={`M${32 - 6} ${MID_Y}h12`}
        stroke={colors.neutral}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Arrow from={56} to={92} />
      <circle
        cx={108}
        cy={MID_Y - 6}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
        strokeWidth={1.3}
      />
      <polygon
        points="122,10 140,24 122,38"
        fill={colors.angleFill}
        stroke={colors.angleStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={132}
        cy={MID_Y}
        r={6}
        fill={colors.nodeFill}
        stroke={colors.nodeStroke}
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
  const head = direction === 1
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
    description:
      "Axiom 1 (Inversion): remove the paired round/square wrapper from the selection.",
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
    description:
      "Axiom 2 (Arrangement): push the surrounding round context into each child of the square frame.",
    Glyph: DisperseGlyph,
  },
  collect: {
    label: "Collect",
    hint: "Merge context",
    description:
      "Axiom 2 (Arrangement): merge matching round contexts back into a single square frame.",
    Glyph: CollectGlyph,
  },
  cancel: {
    label: "Cancel",
    hint: "Erase pair",
    description:
      "Axiom 3 (Reflection): remove a form together with its angled reflection, returning to the void.",
    Glyph: CancelGlyph,
  },
  create: {
    label: "Create Pair",
    hint: "Spawn pair",
    description:
      "Axiom 3 (Reflection): create a form plus its angled reflection from empty space.",
    Glyph: CreatePairGlyph,
  },
};

export type ActionMetadataMap = typeof ACTION_METADATA;
