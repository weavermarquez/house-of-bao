import { type RawLevelDefinition } from "./types";

export const rawLevels: RawLevelDefinition[] = [
  {
    id: "level-00",
    name: "Make Something from Nothing",
    description: "Use Enfold to build a frame and two marks from the void.",
    difficulty: 1,
    allowedAxioms: ["inversion"],
    allowedOperations: ["enfoldFrame", "enfoldMark"],
    start: [],
    goal: [
      {
        boundary: "round",
        children: [{ boundary: "square", children: [] }],
      },
      {
        boundary: "square",
        children: [{ boundary: "round", children: [] }],
      },
      {
        boundary: "square",
        children: [{ boundary: "round", children: [] }],
      },
    ],
    tutorialSteps: [
      {
        id: "level-00-start",
        trigger: "level_start",
        position: "center",
        title: "Draw the first boundaries",
        message:
          "The board begins as pure void. Tap **Enfold Frame (○□)** or **Enfold Mark (□○)** to create boundaries. Build one frame and two marks to match the goal. Order does not matter.",
      },
      {
        id: "level-00-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Selections glow blue",
        message:
          "Tap again to deselect. You can select multiple siblings before pressing Enfold.",
      },
      {
        id: "level-00-hover",
        trigger: "button_hover",
        position: "bottom",
        title: "Only Enfold is active",
        message:
          "Every other action is locked in this tutorial. Try both Enfold buttons to see how Frame (○□) and Mark (□○) differ.",
      },
    ],
  },
  {
    id: "level-01",
    name: "First Unwrap",
    description: "Remove the paired boundaries to reveal the unit.",
    difficulty: 1,
    allowedAxioms: ["inversion"],
    allowedOperations: ["clarify"],
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
    tutorialSteps: [
      {
        id: "level-01-start",
        trigger: "level_start",
        position: "center",
        title: "Unwrap the sandwich",
        message:
          "This form is a **round** wrapped around a **square** which wraps a round. Clarify removes the paired boundaries so only the inner round remains.",
      },
      {
        id: "level-01-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Use Clarify",
        message:
          "With the pair selected, press Clarify to cancel the round-square wrapper. The glow shows what will be affected.",
      },
      {
        id: "level-01-hover",
        trigger: "button_hover",
        position: "bottom",
        title: "Paired boundaries cancel",
        message:
          "Clarify always deletes a round-square or square-round pair when it contains exactly one thing.",
      },
    ],
  },
  {
    id: "level-02",
    name: "Split the Frame",
    description: "Disperse a shared square into separate frames.",
    difficulty: 1,
    allowedAxioms: ["arrangement"],
    allowedOperations: ["disperse"],
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
    tutorialSteps: [
      {
        id: "level-02-start",
        trigger: "level_start",
        position: "center",
        title: "Frame with shared contents",
        message:
          "A round frame contains a square holding two rounds. Arrangement lets the square's contents spread into separate frames.",
      },
      {
        id: "level-02-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Select the contents",
        message:
          "Select the circles inside the square, then press Disperse to give each its own frame.",
      },
      {
        id: "level-02-hover",
        trigger: "button_hover",
        position: "bottom",
        title: "Disperse spreads context",
        message:
          "Disperse clones the surrounding frame for each item inside the square.",
      },
    ],
  },
  {
    id: "level-025",
    name: "Collect the Pair",
    description: "Merge matching frames back together.",
    difficulty: 1,
    allowedAxioms: ["arrangement"],
    allowedOperations: ["collect"],
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
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [{ boundary: "angle", children: [] }],
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
            children: [
              { boundary: "round", children: [] },
              { boundary: "angle", children: [] },
            ],
          },
        ],
      },
    ],
    tutorialSteps: [
      {
        id: "level-025-start",
        trigger: "level_start",
        position: "center",
        title: "Matching frames",
        message:
          "Two identical frames differ only in what the square contains. Arrangement can collect them into one frame.",
      },
      {
        id: "level-025-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Select both frames",
        message:
          "Tap each outer round so both glow blue, then press Collect to merge their square contents.",
      },
      {
        id: "level-025-hover",
        trigger: "button_hover",
        position: "bottom",
        title: "Collect finds common context",
        message:
          "Collect only works when the selected frames share the same surroundings.",
      },
    ],
  },
  {
    id: "level-03",
    name: "Create Reflections",
    description: "Use Create to spawn a form and its angled mirror.",
    difficulty: 1,
    allowedAxioms: ["reflection"],
    allowedOperations: ["create"],
    start: [
      {
        boundary: "round",
        children: [],
      },
    ],
    goal: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
      {
        boundary: "angle",
        children: [{ boundary: "round", children: [] }],
      },
      { boundary: "angle", children: [] },
    ],
    tutorialSteps: [
      {
        id: "level-03-start",
        trigger: "level_start",
        position: "center",
        title: "Spawn a reflection",
        message:
          "Select the round and press **Create** to produce a clone and its angled reflection. Then try Create with nothing selected to summon an empty angle.",
      },
      {
        id: "level-03-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Create copies context",
        message:
          "Whatever you select becomes both the original and the mirrored child inside an angle.",
      },
      {
        id: "level-03-hover",
        trigger: "button_hover",
        position: "bottom",
        title: "Create without a template",
        message:
          "No selection? Create conjures a bare angle (<>), the reflection of void.",
      },
    ],
  },
  {
    id: "level-04",
    name: "Void Sandwich",
    description: "Peel away layered round-square pairs until nothing remains.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    allowedOperations: ["clarify"],
    start: [
      {
        boundary: "round",
        children: [
          {
            boundary: "square",
            children: [
              {
                boundary: "round",
                children: [{ boundary: "square", children: [] }],
              },
              {
                boundary: "square",
                children: [{ boundary: "round", children: [] }],
              },
            ],
          },
        ],
      },
      {
        boundary: "square",
        children: [
          {
            boundary: "round",
            children: [{ boundary: "square", children: [] }],
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
    ],
    goal: [],
    tutorialSteps: [
      {
        id: "level-04-start",
        trigger: "level_start",
        position: "center",
        title: "A forest of void",
        message:
          "Every form here collapses under Clarify. Work from the outside in until nothing remains.",
      },
      {
        id: "level-04-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Peel layer by layer",
        message:
          "Clarify one wrapper at a time. If you overshoot, use Undo to try again.",
      },
    ],
  },
  {
    id: "level-05",
    name: "Void Collapse",
    description: "Cancel a form with its reflection.",
    difficulty: 2,
    allowedAxioms: ["reflection"],
    allowedOperations: ["cancel"],
    start: [
      { boundary: "round", children: [] },
      {
        boundary: "angle",
        children: [
          { boundary: "round", children: [] },
          { boundary: "round", children: [] },
          {
            boundary: "angle",
            children: [{ boundary: "round", children: [] }],
          },
        ],
      },
    ],
    goal: [],
    tutorialSteps: [
      {
        id: "level-05-start",
        trigger: "level_start",
        position: "center",
        title: "Find the matching pair",
        message:
          "Reflection says **A <A> = void**. Select the round and the angle that contains its mirror, then press Cancel.",
      },
      {
        id: "level-05-hover",
        trigger: "button_hover",
        position: "bottom",
        title: "Cancel removes both",
        message:
          "When the highlighted forms are true reflections, Cancel erases them together.",
      },
    ],
  },
  {
    id: "level-051",
    name: "Frame or Mark?",
    description: "Wrap four units into both a frame and a mark.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    allowedOperations: ["enfoldFrame", "enfoldMark"],
    start: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
    ],
    goal: [
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
      {
        boundary: "square",
        children: [
          {
            boundary: "round",
            children: [
              { boundary: "round", children: [] },
              { boundary: "round", children: [] },
            ],
          },
        ],
      },
    ],
    tutorialSteps: [
      {
        id: "level-051-start",
        trigger: "level_start",
        position: "center",
        title: "Two bundles, two styles",
        message:
          "You have four separate rounds. Wrap two of them with **Enfold Frame (○□)** and the other two with **Enfold Mark (□○)**.",
      },
      {
        id: "level-051-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Select both first",
        message:
          "Select two sibling rounds together, then choose which Enfold button to apply.",
      },
      {
        id: "level-051-after",
        trigger: "button_hover",
        position: "bottom",
        title: "Different wrappers, same meaning",
        message:
          "Frames and marks are void-equivalent until you add more context. Try both styles to complete the goal.",
      },
    ],
  },
  {
    id: "level-055",
    name: "Gather the Forest",
    description: "Collect matching frames into a single container.",
    difficulty: 2,
    allowedAxioms: ["arrangement"],
    allowedOperations: ["collect"],
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
          { boundary: "round", children: [] },
        ],
      },
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
          { boundary: "round", children: [] },
        ],
      },
    ],
    goal: [
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
          { boundary: "round", children: [] },
        ],
      },
    ],
    tutorialSteps: [
      {
        id: "level-055-start",
        trigger: "level_start",
        position: "center",
        title: "Two matching clumps",
        message:
          "Both frames share the same outside context. Collect them to combine their square contents.",
      },
      {
        id: "level-055-select",
        trigger: "first_selection",
        position: "bottom",
        title: "Select the outer rounds",
        message:
          "Tap each top-level frame so they glow together, then press Collect.",
      },
    ],
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
                label: "A",
              },
            ],
          },
        ],
      },
    ],
    goal: [
      {
        boundary: "atom",
        label: "A",
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
            label: "A",
          },
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "B",
              },
              {
                boundary: "atom",
                label: "D",
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
            label: "A",
          },
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "B",
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
            label: "A",
          },
          {
            boundary: "square",
            children: [
              {
                boundary: "atom",
                label: "D",
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
    goal: [
      { boundary: "round", children: [] },
      { boundary: "round", children: [] },
    ],
  },
];
