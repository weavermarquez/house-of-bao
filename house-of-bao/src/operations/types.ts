export const OPERATION_KEYS = [
  "clarify",
  "enfoldFrame",
  "enfoldMark",
  "disperse",
  "collect",
  "cancel",
  "create",
  "addRound",
  "addSquare",
  "addAngle",
  "addVariable",
] as const;

export type OperationKey = (typeof OPERATION_KEYS)[number];
