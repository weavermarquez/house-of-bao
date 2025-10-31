import { type RawLevelDefinition } from "./types";

export const rawLevels: RawLevelDefinition[] = [
  {
    id: "level-01",
    name: "First Unwrap",
    description: "Remove the paired boundaries to reveal the unit.",
    difficulty: 1,
    allowedAxioms: ["inversion"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [{ boundary: "round", children: [] }],
          },
        ],
      },
    ],
    goal: [
      {
        boundary: "round",
        children: [],
      },
    ],
  },
  {
    id: "level-02",
    name: "Split the Context",
    description: "Disperse the shared square into separate frames.",
    difficulty: 1,
    allowedAxioms: ["arrangement"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
            ],
          },
        ],
      },
    ],
    goal: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [{ boundary: "round", children: [] }],
          },
        ],
      },
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [{ boundary: "round", children: [] }],
          },
        ],
      },
    ],
  },
  {
    id: "level-03",
    name: "Create and Cancel",
    description: "Create a reflected pair from nothing.",
    difficulty: 1,
    allowedAxioms: ["reflection"],
    start: [],
    goal: [
      {
        boundary: "angle",
        children: [],
      },
    ],
  },
];
