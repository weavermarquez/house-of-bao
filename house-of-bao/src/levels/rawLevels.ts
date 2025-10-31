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
  {
    id: "level-04",
    name: "Void Sandwich",
    description: "Peel away a round-square pair to reveal the void.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [],
          },
        ],
      },
    ],
    goal: [],
  },
  {
    id: "level-05",
    name: "Mirror Collapse",
    description: "Cancel a unit with its reflection.",
    difficulty: 2,
    allowedAxioms: ["reflection"],
    start: [
      {
        boundary: "angle",
        children: [
          {
            boundary: "round",
            children: [],
          },
        ],
      },
      {
        boundary: "round",
        children: [],
      },
    ],
    goal: [],
  },
  {
    id: "level-06",
    name: "Alpha Unwrap",
    description: "Remove the boundary pair around alpha.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "alpha",
              },
            ],
          },
        ],
      },
    ],
    goal: [
      {
        boundary: "atom",
        label: "alpha",
      },
    ],
  },
  {
    id: "level-07",
    name: "Split the Square",
    description: "Disperse a shared square into separate frames.",
    difficulty: 3,
    allowedAxioms: ["arrangement"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "atom",
            label: "alpha",
          },
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "beta",
              },
              {
                boundary: "atom",
                label: "gamma",
              },
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
            boundary: "atom",
            label: "alpha",
          },
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "beta",
              },
            ],
          },
        ],
      },
      {
        boundary: "round",
        children: [
          {
            boundary: "atom",
            label: "alpha",
          },
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "gamma",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "level-08",
    name: "Subtract 4 - 2",
    description: "Introduce the anti-pair and cancel it away.",
    difficulty: 2,
    allowedAxioms: ["reflection"],
    start: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
      {
        boundary: "angle",
        children: [
          { boundary: "round", children: [] },
          { boundary: "round", children: [] },
        ],
      },
    ],
    goal: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
    ],
  },
  {
    id: "level-09",
    name: "Multiply 4 × 2",
    description: "Disperse the shared square into two frames of four.",
    difficulty: 3,
    allowedAxioms: ["arrangement", "inversion", "reflection"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
            ],
          },
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
    goal: Array.from({ length: 8 }, () => ({
      boundary: "round",
    })),
  },
  {
    id: "level-10",
    name: "Divide 4 / 2",
    description: "Share four units equally between two frames.",
    difficulty: 3,
    allowedAxioms: ["arrangement", "inversion", "reflection"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
            ],
          },
          {
            boundary: "angle",
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
      },
    ],
    goal: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
    ],
  },
  {
    id: "level-11",
    name: "Simplify 2/4",
    description: "Reduce two fourths to one half via arrangement.",
    difficulty: 4,
    allowedAxioms: ["arrangement", "inversion", "reflection"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [
              { boundary: "round", children: [] },
              {
                boundary: "angle",
                children: [
                  {
                    boundary: "square",
                    children: [
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                    ],
                  },
                ],
              },
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
            boundary: "angle",
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
      },
    ],
  },
  {
    id: "level-12",
    name: "Square 4^2",
    description: "Expand four squared into sixteen units.",
    difficulty: 5,
    allowedAxioms: ["arrangement", "inversion", "reflection"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: [
                  {
                    boundary: "square",
                    children: [
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                    ],
                  },
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
          },
        ],
      },
    ],
    goal: Array.from({ length: 16 }, () => ({
      boundary: "round",
      children: [],
    })),
  },
  {
    id: "level-13",
    name: "Square Root of 4",
    description: "Peel apart the reciprocal exponent to reveal two units.",
    difficulty: 5,
    allowedAxioms: ["arrangement", "reflection", "inversion"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: [
                  {
                    boundary: "square",
                    children: [
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                      { boundary: "round", children: [] },
                    ],
                  },
                  {
                    boundary: "angle",
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
              },
            ],
          },
        ],
      },
    ],
    goal: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
    ],
  },
];
