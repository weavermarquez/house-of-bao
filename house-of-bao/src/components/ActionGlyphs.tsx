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

const colors = {
  roundFill: "#fde68a",
  roundStroke: "#b45309",
  squareFill: "#bfdbfe",
  squareStroke: "#1d4ed8",
  accentFill: "#e0e7ff",
  accentStroke: "#4338ca",
  angleFill: "#e9d5ff",
  angleStroke: "#7c3aed",
  arrow: "#2563eb",
  dashed: "#94a3b8",
};

const baseSvgProps = {
  role: "presentation",
  "aria-hidden": "true",
  focusable: "false",
} as const;

function ClarifyGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <rect
        x={6}
        y={7}
        width={20}
        height={22}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={2}
      />
      <circle
        cx={16}
        cy={18}
        r={8}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <path
        d="M34 18h18"
        stroke={colors.arrow}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <polyline
        points="44,12 52,18 44,24"
        fill="none"
        stroke={colors.arrow}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EnfoldFrameGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <circle
        cx={22}
        cy={18}
        r={14}
        fill="#fef3c7"
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <rect
        x={11}
        y={9}
        width={22}
        height={18}
        rx={5}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle cx={22} cy={14} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <circle cx={22} cy={22} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <rect
        x={40}
        y={12}
        width={16}
        height={12}
        rx={4}
        fill={colors.accentFill}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
      />
    </svg>
  );
}

function EnfoldMarkGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <rect
        x={7}
        y={7}
        width={26}
        height={22}
        rx={5}
        fill="none"
        stroke={colors.squareStroke}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <circle
        cx={20}
        cy={18}
        r={12}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.8}
      />
      <rect
        x={12}
        y={10}
        width={16}
        height={16}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.6}
      />
      <circle cx={42} cy={14} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <circle cx={48} cy={22} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
    </svg>
  );
}

function DisperseGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <rect
        x={6}
        y={7}
        width={18}
        height={22}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={2}
      />
      <circle cx={12} cy={15} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <circle cx={18} cy={22} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <path
        d="M28 18l8-6m-8 6 8 6"
        stroke={colors.arrow}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x={42}
        y={10}
        width={8}
        height={8}
        rx={2}
        fill={colors.accentFill}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
      />
      <rect
        x={50}
        y={18}
        width={8}
        height={8}
        rx={2}
        fill={colors.accentFill}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
      />
    </svg>
  );
}

function CollectGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <rect
        x={40}
        y={7}
        width={18}
        height={22}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={2}
      />
      <circle cx={46} cy={15} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <circle cx={52} cy={22} r={3} fill={colors.roundFill} stroke={colors.roundStroke} strokeWidth={1} />
      <path
        d="M36 18l-8-6m8 6-8 6"
        stroke={colors.arrow}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x={14}
        y={10}
        width={8}
        height={8}
        rx={2}
        fill={colors.accentFill}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
      />
      <rect
        x={6}
        y={18}
        width={8}
        height={8}
        rx={2}
        fill={colors.accentFill}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
      />
    </svg>
  );
}

function CancelGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <circle
        cx={18}
        cy={18}
        r={10}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <polygon
        points="46,8 56,18 46,28"
        fill={colors.angleFill}
        stroke={colors.angleStroke}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <line
        x1={10}
        y1={18}
        x2={60}
        y2={18}
        stroke={colors.dashed}
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />
      <path
        d="M28 12l8 12m0-12-8 12"
        stroke="#dc2626"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CreatePairGlyph({ className }: GlyphProps) {
  return (
    <svg
      {...baseSvgProps}
      className={className}
      width={64}
      height={36}
      viewBox="0 0 64 36"
    >
      <circle
        cx={20}
        cy={18}
        r={5}
        fill={colors.accentFill}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={20}
        cy={18}
        r={9}
        stroke={colors.accentStroke}
        strokeWidth={1.6}
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M6 18h8"
        stroke={colors.accentStroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M10 14v8"
        stroke={colors.accentStroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M30 18h12"
        stroke={colors.arrow}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={48}
        cy={14}
        r={6}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <circle
        cx={56}
        cy={22}
        r={6}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
    </svg>
  );
}

export const ACTION_METADATA: Record<OperationKey, ActionMetadata> = {
  clarify: {
    label: "Clarify",
    hint: "unwrap",
    description: "Clarify removes a round/square wrapper from the selected form.",
    Glyph: ClarifyGlyph,
  },
  enfoldFrame: {
    label: "Enfold Frame",
    hint: "○□ shell",
    description: "Enfold Frame wraps siblings with a round-square shell.",
    Glyph: EnfoldFrameGlyph,
  },
  enfoldMark: {
    label: "Enfold Mark",
    hint: "□○ shell",
    description: "Enfold Mark wraps siblings with a square-round shell.",
    Glyph: EnfoldMarkGlyph,
  },
  disperse: {
    label: "Disperse",
    hint: "split",
    description: "Disperse splits square contents into separate frames.",
    Glyph: DisperseGlyph,
  },
  collect: {
    label: "Collect",
    hint: "merge",
    description: "Collect merges matching frames back together.",
    Glyph: CollectGlyph,
  },
  cancel: {
    label: "Cancel",
    hint: "erase pair",
    description: "Cancel removes a form and its reflection (or empty angle).",
    Glyph: CancelGlyph,
  },
  create: {
    label: "Create Pair",
    hint: "spawn",
    description: "Create Pair spawns a template + reflection at the chosen parent.",
    Glyph: CreatePairGlyph,
  },
};

export type ActionMetadataMap = typeof ACTION_METADATA;
