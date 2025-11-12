import { type RawFormNode, type RawLevelDefinition } from "./types";

const roundNode = (...children: RawFormNode[]): RawFormNode => ({
  boundary: "round",
  children,
});

const squareNode = (...children: RawFormNode[]): RawFormNode => ({
  boundary: "square",
  children,
});

const angleNode = (...children: RawFormNode[]): RawFormNode => ({
  boundary: "angle",
  children,
});

const atomNode = (label: string): RawFormNode => ({
  boundary: "atom",
  label,
});

export const rawLevels: RawLevelDefinition[] = [
  {
    id: "level-00",
    name: "First Creations",
    description: "Enfold the void into one frame and two marks.",
    difficulty: 1,
    allowedAxioms: ["inversion"],
    allowedOperations: ["enfoldFrame", "enfoldMark"],
    start: [],
    goal: [
      roundNode(squareNode()),
      squareNode(roundNode()),
      squareNode(roundNode()),
    ],
    tutorialSteps: [
      {
        id: "level-00-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Shape the void",
        message:
          "Press the Enfold buttons — even with nothing selected — to conjure forms. Build **one frame** (○ outside □) and **two marks** (□ outside ○).",
      },
      {
        id: "level-00-enfold-frame",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="enfoldFrame"] button',
        title: "Enfold Frame",
        message:
          "Wraps the selection with a round exterior and square interior. Use it once to create your frame.",
        priority: 0,
      },
      {
        id: "level-00-enfold-mark",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="enfoldMark"] button',
        title: "Enfold Mark",
        message:
          "Wraps the selection with a square exterior and round interior. Use it twice to make two marks.",
        priority: 1,
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
    start: [roundNode(squareNode(roundNode()))],
    goal: [roundNode()],
    tutorialSteps: [
      {
        id: "level-01-overview",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Spot the wrapper",
        message:
          "A round frame holds a square, which protects a single mark. Clarify the pair so only the inner mark remains.",
      },
      {
        id: "level-01-clarify",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="clarify"] button',
        title: "Use Clarify",
        message:
          "Select the outer form, then press Clarify to remove the matching round–square wrapper.",
        priority: 0,
      },
      {
        id: "level-01-selection",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Great selection!",
        message:
          "See the red outline? That form is active. Clarify now to collapse the wrapper — this is the Inversion axiom.",
      },
    ],
  },
  {
    id: "level-02",
    name: "Split the Context",
    description: "Disperse the shared square into separate frames.",
    difficulty: 1,
    allowedAxioms: ["arrangement"],
    allowedOperations: ["disperse"],
    start: [roundNode(squareNode(roundNode(), roundNode()))],
    goal: [
      roundNode(squareNode(roundNode())),
      roundNode(squareNode(roundNode())),
    ],
    tutorialSteps: [
      {
        id: "level-02-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "One frame, two marks",
        message:
          "A single frame holds two marks inside a square. Disperse them so each mark gains its own frame.",
      },
      {
        id: "level-02-selection",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Select the contents",
        message:
          "Grab both marks inside the square (shift-click or drag) so they glow together before dispersing.",
      },
      {
        id: "level-02-disperse",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="disperse"] button',
        title: "Disperse",
        message:
          "Disperse pushes the surrounding round context into each child of the square. Use it once the marks are selected.",
        priority: 0,
      },
    ],
  },
  {
    id: "level-025",
    name: "Gather the Marks",
    description: "Collect matching frames back into one container.",
    difficulty: 1,
    allowedAxioms: ["arrangement"],
    allowedOperations: ["collect"],
    start: [
      roundNode(squareNode(atomNode("B"))),
      roundNode(squareNode(atomNode("C"))),
    ],
    goal: [roundNode(squareNode(atomNode("B"), atomNode("C")))],
    tutorialSteps: [
      {
        id: "level-025-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Two frames, one idea",
        message:
          "These frames share the same empty context. Collect them to place both marks inside a single square.",
      },
      {
        id: "level-025-select",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Select every frame",
        message:
          "Collect needs all matching frames selected. Tap both rounds so their outlines glow red together.",
      },
      {
        id: "level-025-collect",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="collect"] button',
        title: "Collect",
        message:
          "Collect merges frames that share context. It will tuck both marks into one square.",
        priority: 0,
      },
    ],
  },
  {
    id: "level-03",
    name: "Create Reflections",
    description: "Summon reflections with the Create action.",
    difficulty: 1,
    allowedAxioms: ["reflection"],
    allowedOperations: ["create"],
    start: [roundNode()],
    goal: [
      roundNode(),
      roundNode(),
      angleNode(roundNode()),
      angleNode(),
    ],
    tutorialSteps: [
      {
        id: "level-03-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Spawn reflections",
        message:
          "Use Create twice: once with the mark selected to duplicate it, and once with nothing selected to form an empty angle.",
      },
      {
        id: "level-03-create",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="create"] button',
        title: "Create pair",
        message:
          "Create copies the selection and adds its angled reflection. Select the round mark, press Create, then try Create again with nothing selected.",
        priority: 0,
      },
      {
        id: "level-03-selection",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Template ready",
        message:
          "The highlighted mark becomes the template. Create adds the form plus its angled partner right beside it.",
      },
    ],
  },
  {
    id: "level-04",
    name: "Void Sandwich",
    description: "Clarify a stack of paired boundaries until nothing remains.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    allowedOperations: ["clarify"],
    start: [
      roundNode(squareNode(squareNode(roundNode()))),
      squareNode(roundNode(squareNode(roundNode()))),
      roundNode(squareNode(roundNode(squareNode()))),
      squareNode(roundNode(roundNode(squareNode()))),
    ],
    goal: [],
    tutorialSteps: [
      {
        id: "level-04-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Peel every layer",
        message:
          "Each form hides stacked round–square shells. Clarify repeatedly until the forest collapses to the void.",
      },
      {
        id: "level-04-clarify",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="clarify"] button',
        title: "Multiple clarifies",
        message:
          "Some clarifies reveal another pair. Keep selecting the new pair and clarifying until it disappears.",
        priority: 0,
      },
    ],
  },
  {
    id: "level-05",
    name: "Mirror Collapse",
    description: "Cancel each form with its reflection.",
    difficulty: 2,
    allowedAxioms: ["reflection"],
    allowedOperations: ["cancel"],
    start: [
      roundNode(),
      angleNode(roundNode()),
      roundNode(angleNode(roundNode())),
      angleNode(roundNode(angleNode(roundNode()))),
    ],
    goal: [],
    tutorialSteps: [
      {
        id: "level-05-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Find the reflections",
        message:
          "Every form has a matching angled reflection. Select a base form plus its angled partner to cancel them away.",
      },
      {
        id: "level-05-selection",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Select both halves",
        message:
          "Use multi-select so the base form **and** the angled form glow red together. Cancel only works when both are selected.",
      },
      {
        id: "level-05-cancel",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="cancel"] button',
        title: "Cancel pairs",
        message:
          "Cancel removes a form with its identical angled copy. Two cancels will clear the board.",
        priority: 0,
      },
    ],
  },
  {
    id: "level-051",
    name: "Frame or Mark?",
    description: "Wrap pairs of marks with either Enfold action.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    allowedOperations: ["enfoldFrame", "enfoldMark"],
    start: [roundNode(), roundNode(), roundNode(), roundNode()],
    goal: [
      roundNode(squareNode(roundNode(), roundNode())),
      squareNode(roundNode(roundNode(), roundNode())),
    ],
    tutorialSteps: [
      {
        id: "level-051-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Two pairs to wrap",
        message:
          "Group four marks into two bundles. Wrap one pair as a frame (○□) and the other as a mark (□○).",
      },
      {
        id: "level-051-select",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Select a pair",
        message:
          "Select two marks that share the same parent so they glow red together before choosing how to enfold them.",
      },
      {
        id: "level-051-frame",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="enfoldFrame"] button',
        title: "Try Enfold Frame",
        message:
          "Use Enfold Frame on one pair. Notice the round exterior and square interior — a classic frame.",
        priority: 0,
      },
      {
        id: "level-051-mark",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="enfoldMark"] button',
        title: "Then Enfold Mark",
        message:
          "Use Enfold Mark on the other pair. Square outside, round inside — functionally equivalent until more context appears.",
        priority: 1,
      },
    ],
  },
  {
    id: "level-055",
    name: "Context Collector",
    description: "Collect matching frames that share a round context.",
    difficulty: 2,
    allowedAxioms: ["arrangement"],
    allowedOperations: ["collect"],
    start: [
      roundNode(squareNode(roundNode(), roundNode()), roundNode()),
      roundNode(squareNode(roundNode(), roundNode()), roundNode()),
    ],
    goal: [
      roundNode(
        squareNode(
          roundNode(),
          roundNode(),
          roundNode(),
          roundNode(),
        ),
        roundNode(),
      ),
    ],
    tutorialSteps: [
      {
        id: "level-055-intro",
        trigger: "level_start",
        position: "center",
        targetElement: ".network-view-container",
        title: "Shared context",
        message:
          "Each frame has a round context plus a square containing two marks. Collect them into a single frame.",
      },
      {
        id: "level-055-select",
        trigger: "first_selection",
        position: "center",
        targetElement: ".network-view-container",
        title: "Select both frames",
        message:
          "Collect needs every matching frame selected. Grab both rounds so their contexts highlight together.",
      },
      {
        id: "level-055-collect",
        trigger: "button_hover",
        position: "right",
        targetElement: '[data-action-key="collect"] button',
        title: "Collect with context",
        message:
          "Collect merges the squares and keeps the shared round context once. Watch the outside round stay while the square grows.",
        priority: 0,
      },
    ],
  },
  {
    id: "level-06",
    name: "Alpha Unwrap",
    description: "Remove the boundary pair around alpha.",
    difficulty: 2,
    allowedAxioms: ["inversion"],
    start: [roundNode(squareNode(atomNode("A")))],
    goal: [
      atomNode("A"),
    ],
  },
  {
    id: "level-07",
    name: "Split the Square",
    description: "Disperse a shared square into separate frames.",
    difficulty: 3,
    allowedAxioms: ["arrangement"],
    start: [
      roundNode(atomNode("A"), squareNode(atomNode("B"), atomNode("D"))),
    ],
    goal: [
      roundNode(atomNode("A"), squareNode(atomNode("B"))),
      roundNode(atomNode("A"), squareNode(atomNode("D"))),
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
