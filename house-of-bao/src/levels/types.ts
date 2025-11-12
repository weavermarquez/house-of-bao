import { type BoundaryType, type Form } from "../logic";
import type { OperationKey } from "../operations/types";

export type AxiomType = "inversion" | "arrangement" | "reflection";

export type RawFormNode = {
  boundary: BoundaryType;
  label?: string;
  children?: RawFormNode[];
};

export type RawLevelDefinition = {
  id: string;
  name: string;
  description?: string;
  start: RawFormNode[];
  goal: RawFormNode[];
  maxMoves?: number;
  allowedAxioms?: AxiomType[];
  allowedOperations?: OperationKey[];
  tutorialSteps?: TutorialStep[]; // Optional step list for contextual guidance
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type LevelDefinition = {
  id: string;
  name: string;
  description?: string;
  start: Form[];
  goal: Form[];
  maxMoves?: number;
  allowedAxioms?: AxiomType[];
  allowedOperations?: OperationKey[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  tutorialSteps?: TutorialStep[]; // Optional step list for contextual guidance
  hints?: string[]; // Progressive hint strings when players are stuck
};

export type TutorialTrigger =
  | "level_start" // Show immediately when level loads
  | "first_selection" // After the player selects their first form
  | "button_hover" // When any action button is focused/hovered
  | "action_available" // As soon as a specific action becomes usable
  | "custom"; // External/manual trigger

export type TutorialPosition = "top" | "bottom" | "left" | "right" | "center";

export type TutorialIllustration = {
  type: "bounding_box" | "custom_svg";
  svgContent?: string; // Raw SVG string inserted directly
  width?: number; // Defaults to 200 if omitted
  height?: number; // Defaults to 120 if omitted
};

export type TutorialStep = {
  id: string; // Unique identifier for deduping/persistence
  trigger: TutorialTrigger; // Event that should surface this step
  targetElement?: string; // CSS selector to highlight a DOM node
  targetLabel?: string; // Optional label lookup for logical targets
  position: TutorialPosition; // Overlay placement relative to target
  title: string; // Bold heading text
  message: string; // Markdown-enabled body copy
  illustration?: TutorialIllustration; // Optional supporting art/SVG
  dismissOnAction?: boolean; // Auto-hide when related action fires
  requiredAction?: "select" | "button_click" | "any"; // Gate completion type
  priority?: number; // Sorting weight (default 0)
};
