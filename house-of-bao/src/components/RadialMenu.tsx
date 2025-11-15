import { useMemo, useState } from "react";

import { ACTION_METADATA } from "./ActionGlyphs";
import {
  type OperationAvailabilityMap,
  type OperationAvailability,
} from "../hooks/useAvailableOperations";
import type { OperationKey } from "../operations/types";

import "./RadialMenu.css";

const MENU_SIZE = 280;
const MENU_RADIUS = MENU_SIZE / 2;
const OUTER_RADIUS = MENU_RADIUS - 6;
const INNER_RADIUS = MENU_RADIUS * 0.55;
const CENTER_RADIUS = MENU_RADIUS * 0.28;
const LONG_ARC_THRESHOLD = 180;

type RadialMenuMode = "main" | "sandbox";

export type RadialMenuProps = {
  x: number;
  y: number;
  mode: RadialMenuMode;
  selectedNodeIds: readonly string[];
  selectedParentId: string | null;
  operationAvailability: OperationAvailabilityMap;
  sandboxEnabled: boolean;
  onOperationSelect: (operation: OperationKey) => void;
  onModeToggle: () => void;
  onClose: () => void;
};

type WedgeDefinition = {
  id: string;
  startAngle: number;
  endAngle: number;
  primaryOperation: OperationKey;
  fallbackOperations?: OperationKey[];
};

const MAIN_WEDGES: WedgeDefinition[] = [
  {
    id: "clarify",
    startAngle: 300,
    endAngle: 360,
    primaryOperation: "clarify",
  },
  {
    id: "collect",
    startAngle: 240,
    endAngle: 300,
    primaryOperation: "collect",
  },
  {
    id: "cancel",
    startAngle: 180,
    endAngle: 240,
    primaryOperation: "cancel",
  },
  {
    id: "create",
    startAngle: 120,
    endAngle: 180,
    primaryOperation: "create",
  },
  {
    id: "disperse",
    startAngle: 60,
    endAngle: 120,
    primaryOperation: "disperse",
  },
  {
    id: "enfold",
    startAngle: 0,
    endAngle: 60,
    primaryOperation: "enfoldFrame",
    fallbackOperations: ["enfoldMark"],
  },
];

type ComputedWedge = WedgeDefinition & {
  available: boolean;
  availability: OperationAvailability;
  glyphClassName: string;
  label: string;
};

type PolarPoint = { x: number; y: number };

const toRadians = (angle: number) => ((angle - 90) * Math.PI) / 180;

const polarToCartesian = (radius: number, angle: number): PolarPoint => {
  const radians = toRadians(angle);
  return {
    x: MENU_RADIUS + radius * Math.cos(radians),
    y: MENU_RADIUS + radius * Math.sin(radians),
  };
};

const describeWedge = (
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string => {
  const startOuter = polarToCartesian(outerRadius, startAngle);
  const endOuter = polarToCartesian(outerRadius, endAngle);
  const startInner = polarToCartesian(innerRadius, endAngle);
  const endInner = polarToCartesian(innerRadius, startAngle);
  const largeArc = endAngle - startAngle > LONG_ARC_THRESHOLD ? 1 : 0;

  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArc,
    1,
    endOuter.x,
    endOuter.y,
    "L",
    startInner.x,
    startInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArc,
    0,
    endInner.x,
    endInner.y,
    "Z",
  ].join(" ");
};

const chooseAvailability = (
  definition: WedgeDefinition,
  availability: OperationAvailabilityMap,
): OperationAvailability => {
  const operations = [
    definition.primaryOperation,
    ...(definition.fallbackOperations ?? []),
  ];

  for (const key of operations) {
    const entry = availability[key];
    if (entry?.available) {
      return entry;
    }
  }

  const fallbackKey = operations.find((key) => availability[key] !== undefined);
  if (fallbackKey) {
    return availability[fallbackKey];
  }

  return { available: false };
};

const computeWedges = (
  availability: OperationAvailabilityMap,
): ComputedWedge[] => {
  return MAIN_WEDGES.map((definition) => {
    const availabilityEntry = chooseAvailability(definition, availability);
    const metadata = ACTION_METADATA[definition.primaryOperation];
    return {
      ...definition,
      available: Boolean(availabilityEntry?.available),
      availability: availabilityEntry,
      glyphClassName: `radial-menu__glyph radial-menu__glyph--${definition.id}`,
      label: metadata?.label ?? definition.id,
    };
  });
};

const describeLabelPosition = (start: number, end: number) => {
  const middleAngle = start + (end - start) / 2;
  const radius = (INNER_RADIUS + OUTER_RADIUS) / 2;
  return polarToCartesian(radius, middleAngle);
};

export function RadialMenu({
  x,
  y,
  mode,
  operationAvailability,
  sandboxEnabled,
  onOperationSelect,
  onModeToggle,
  onClose,
}: RadialMenuProps) {
  const [hoveredWedge, setHoveredWedge] = useState<string | null>(null);

  const wedges = useMemo(
    () => computeWedges(operationAvailability),
    [operationAvailability],
  );

  if (mode !== "main") {
    // Phase 2 only renders the main menu. Future phases will add sandbox mode.
    return null;
  }

  return (
    <div
      className="radial-menu"
      style={{
        left: x,
        top: y,
      }}
      role="dialog"
      aria-label="Axiom radial menu"
    >
      <svg
        className="radial-menu__svg"
        viewBox={`0 0 ${MENU_SIZE} ${MENU_SIZE}`}
        width={MENU_SIZE}
        height={MENU_SIZE}
      >
        <circle
          className="radial-menu__halo"
          cx={MENU_RADIUS}
          cy={MENU_RADIUS}
          r={OUTER_RADIUS}
        />

        {wedges.map((wedge) => {
          const metadata = ACTION_METADATA[wedge.primaryOperation];
          const Glyph = metadata?.Glyph;
          const labelPosition = describeLabelPosition(
            wedge.startAngle,
            wedge.endAngle,
          );
          const isDisabled = !wedge.available;
          const isHovered = hoveredWedge === wedge.id;

          return (
            <g key={wedge.id} className="radial-menu__segment">
              <path
                className={[
                  "radial-menu__wedge",
                  `radial-menu__wedge--${wedge.id}`,
                  isDisabled ? "is-disabled" : "",
                  isHovered ? "is-hovered" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                d={describeWedge(
                  INNER_RADIUS,
                  OUTER_RADIUS,
                  wedge.startAngle,
                  wedge.endAngle,
                )}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-disabled={isDisabled}
                aria-label={metadata?.label ?? wedge.id}
                onClick={() => {
                  if (isDisabled) {
                    return;
                  }
                  onOperationSelect(wedge.primaryOperation);
                  onClose();
                }}
                onKeyDown={(event) => {
                  if (isDisabled) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOperationSelect(wedge.primaryOperation);
                    onClose();
                  }
                }}
                onMouseEnter={() => setHoveredWedge(wedge.id)}
                onMouseLeave={() => setHoveredWedge((current) =>
                  current === wedge.id ? null : current,
                )}
              />
              {Glyph ? (
                <g
                  className="radial-menu__icon"
                  transform={`translate(${labelPosition.x} ${labelPosition.y}) scale(0.35)`}
                >
                  <Glyph className={wedge.glyphClassName} />
                </g>
              ) : null}
              <text
                className="radial-menu__label"
                x={labelPosition.x}
                y={labelPosition.y + 40}
              >
                {wedge.label}
              </text>
            </g>
          );
        })}

        <g className="radial-menu__center">
          <circle
            cx={MENU_RADIUS}
            cy={MENU_RADIUS}
            r={CENTER_RADIUS}
            className={sandboxEnabled ? "is-active" : ""}
            role="button"
            tabIndex={0}
            aria-pressed={sandboxEnabled}
            aria-label="Toggle sandbox submenu"
            onClick={() => {
              onModeToggle();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onModeToggle();
              }
            }}
          />
          <text
            x={MENU_RADIUS}
            y={MENU_RADIUS + 6}
            textAnchor="middle"
            className="radial-menu__center-label"
          >
            Sandbox
          </text>
        </g>
      </svg>
    </div>
  );
}
