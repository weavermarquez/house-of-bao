import { useMemo } from "react";

import type { OperationAvailabilityMap } from "../hooks/useAvailableOperations";
import type { OperationKey } from "../operations/types";
import type { GameOperation } from "../store/gameStore";
import { ACTION_METADATA } from "./ActionGlyphs";

import "./RadialMenu.css";

export const RADIAL_MENU_DIAMETER = 280;
const RADIAL_MENU_RADIUS = RADIAL_MENU_DIAMETER / 2;
const CENTER_X = RADIAL_MENU_RADIUS;
const CENTER_Y = RADIAL_MENU_RADIUS;

const MAIN_WEDGES: readonly {
  key: OperationKey;
  startAngle: number;
  endAngle: number;
}[] = [
  { key: "clarify", startAngle: 300, endAngle: 360 },
  { key: "collect", startAngle: 240, endAngle: 300 },
  { key: "cancel", startAngle: 180, endAngle: 240 },
  { key: "create", startAngle: 120, endAngle: 180 },
  { key: "disperse", startAngle: 60, endAngle: 120 },
  { key: "enfoldFrame", startAngle: 0, endAngle: 60 },
];

type RadialMenuProps = {
  x: number;
  y: number;
  mode: "main" | "sandbox";
  selectedNodeIds: string[];
  selectedParentId: string | null;
  operationAvailability: OperationAvailabilityMap;
  sandboxEnabled: boolean;
  onOperationSelect: (operation: GameOperation) => void;
  onModeToggle: () => void;
  onClose: () => void;
};

const toRadians = (angle: number): number => ((angle - 90) * Math.PI) / 180;

const polarToCartesian = (angle: number, radius: number) => ({
  x: CENTER_X + radius * Math.cos(toRadians(angle)),
  y: CENTER_Y + radius * Math.sin(toRadians(angle)),
});

const describeWedge = (startAngle: number, endAngle: number, radius: number) => {
  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  const arcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${CENTER_X} ${CENTER_Y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${arcFlag} 1 ${end.x} ${end.y} Z`;
};

export function RadialMenu({
  x,
  y,
  mode,
  selectedNodeIds,
  selectedParentId,
  operationAvailability,
  sandboxEnabled,
  onOperationSelect,
  onModeToggle,
  onClose,
}: RadialMenuProps) {
  void selectedNodeIds;
  void selectedParentId;
  void sandboxEnabled;
  void onOperationSelect;
  void onClose;

  const wedges = useMemo(
    () =>
      MAIN_WEDGES.map((wedge) => ({
        ...wedge,
        midAngle: wedge.startAngle + (wedge.endAngle - wedge.startAngle) / 2,
      })),
    [],
  );

  const iconRadius = RADIAL_MENU_RADIUS * 0.58;

  if (mode !== "main") {
    // Sandbox mode will be implemented in later phases.
    return null;
  }

  return (
    <div
      className="radial-menu"
      style={{ left: x, top: y }}
      data-mode={mode}
      onClick={(event) => event.stopPropagation()}
    >
      <svg
        className="radial-menu__svg"
        width={RADIAL_MENU_DIAMETER}
        height={RADIAL_MENU_DIAMETER}
        viewBox={`0 0 ${RADIAL_MENU_DIAMETER} ${RADIAL_MENU_DIAMETER}`}
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        {wedges.map((wedge) => {
          const availability = operationAvailability[wedge.key];
          const isAvailable = availability?.available ?? false;
          return (
            <path
              key={wedge.key}
              d={describeWedge(wedge.startAngle, wedge.endAngle, RADIAL_MENU_RADIUS)}
              className={`radial-menu__wedge${isAvailable ? "" : " is-disabled"}`}
              data-operation={wedge.key}
            />
          );
        })}
        <circle
          className="radial-menu__center"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={RADIAL_MENU_RADIUS * 0.3}
          onClick={(event) => {
            event.stopPropagation();
            onModeToggle();
          }}
        />
      </svg>
      <div className="radial-menu__icons">
        {wedges.map((wedge) => {
          const metadata = ACTION_METADATA[wedge.key];
          const availability = operationAvailability[wedge.key];
          const isAvailable = availability?.available ?? false;
          const iconPosition = polarToCartesian(wedge.midAngle, iconRadius);
          const Glyph = metadata?.Glyph;
          return (
            <div
              key={`icon-${wedge.key}`}
              className={`radial-menu__icon${isAvailable ? "" : " is-disabled"}`}
              style={{
                left: iconPosition.x,
                top: iconPosition.y,
              }}
            >
              {Glyph ? <Glyph className="radial-menu__glyph" /> : null}
              <span className="radial-menu__label">{metadata?.label ?? wedge.key}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
