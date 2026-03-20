1.  [The Problem](#org082f3ff)
2.  [What is House of Bao?](#org6563ddb)
3.  [The Vision](#orge2d4e17)
4.  [How It Works: Three Simple Rules](#orgff646a4)
5.  [For Players: Quick Start](#org04a6513)
6.  [Current Status & Roadmap](#org25e4675)
    1.  [v0.x - Playable Prototype (✅ Complete)](#org6f883f4)
    2.  [v1.x - Content Expansion (🔄 In Progress)](#org4334227)
    3.  [v2.x - Advanced Rendering (🗂️ Planning)](#org06ade5d)
7.  [Technical Stack](#org776e377)
8.  [The Academic Foundation](#orga549f2f)
9.  [Links & Resources](#orgb3bc5bf)
10. [Credits](#org330c71e)
11. [Development Notes: Touch & Feel](#orgd6221e0)

****Try it now:**** [house.valeriekim.ca](<https://house.valeriekim.ca>)

<a id=&ldquo;org082f3ff&rdquo;></a>

One third of American adults—and half of all OECD adults—cannot understand fractions. This isn&rsquo;t just a mathematical gap; it&rsquo;s a widespread failure in how we teach abstract thinking.

Here&rsquo;s what fascinated us: players actively complain about games like Hero Wars and Top War Battle Game for ****false advertising****. The ads promised basic arithmetic puzzles, and people genuinely ****wanted**** to play them. The demand for intuitive math is real, but nobody is delivering it well.

We can fix this.

<a id=&ldquo;org6563ddb&rdquo;></a>

House of Bao is a puzzle game where you \\\*play with containers\\\*—numbers that look like what they mean. Using just three simple rules, players build mathematical intuition through touch and experimentation, working their way from basic concepts to solving complex problems.

The game reveals the hidden elegance of mathematics by representing abstract operations as physical transformations. You don&rsquo;t memorize formulas; you ****feel**** how math works.

<a id=&ldquo;orge2d4e17&rdquo;></a>

A touch-based casual mobile game where mathematical forms become tactile objects. We&rsquo;re not simulating physical objects—we&rsquo;re creating something ****better**** than physical. These containers are elastic, they glow, they exist in mirror worlds. Touch interactions reveal mathematical truths in ways that physical objects never could.

This isn&rsquo;t just another ed-tech app. It&rsquo;s a complete reimagining of mathematical notation as ****experiential dialects****: paths, rooms, boundaries, enchanted spaces. The goal is to make abstract algebra feel like a natural extension of your intuition.

<a id=&ldquo;orgff646a4&rdquo;></a>

House of Bao is built on James Algebra, a system of three axioms that govern all mathematical operations:

1.  ****Inversion****: Opposite boundaries cancel each other
    -   \`([A]) = A\`
    -   A round container inside a square container (or vice versa) cancels out

2.  ****Arrangement****: Context distributes across collections
    -   \`(A [B C]) = (A [B])(A [C])\`
    -   A single container can act on multiple forms simultaneously

3.  ****Reflection****: A form and its mirror annihilate
    -   \`A <A> = void\`
    -   Every form has a reflection that cancels it completely

These rules are all you need to understand arithmetic, algebra, and beyond. See [ARCHITECTURE.org](ARCHITECTURE.md) for the complete theory.

<a id=&ldquo;org04a6513&rdquo;></a>

npm install npm run dev

Then open <http://localhost:5173>

Available commands:

-   \`npm run dev\` - Start development server
-   \`npm run build\` - Build for production
-   \`npm run test\` - Run tests (Vitest)
-   \`npm run preview\` - Preview production build

<a id=&ldquo;org25e4675&rdquo;></a>

<a id=&ldquo;org6f883f4&rdquo;></a>

\## v0.x - Playable Prototype (✅ Complete)

-   Core engine with Form data structures and 3 axiom implementation
-   React + SVG rendering system
-   Zustand state management with full history/undo-redo
-   Interactive UI with AxiomActionPanel and ActionGlyphs
-   Level system with JSON serialization
-   Tutorial system with contextual overlays
-   LocalStorage progress persistence
-   Full PWA support with offline capability
-   Deployed at [house.valeriekim.ca](<https://house.valeriekim.ca>)

<a id=&ldquo;org4334227&rdquo;></a>

\## v1.x - Content Expansion (🔄 In Progress)

-   Expand level library (currently ~15 levels)
-   Refine tutorial flow based on playtest feedback
-   Improve visual feedback for operations
-   Mobile touch interaction refinements
-   Responsive design and accessibility improvements
-   YouTube Playables certification compliance

<a id=&ldquo;org06ade5d&rdquo;></a>

\## v2.x - Advanced Rendering (🗂️ Planning)

-   Migrate to canvas-based rendering (PixiJS)
-   Elastic, physics-based interactions
-   Smooth animations and form morphing
-   Advanced visual dialects (paths, rooms, &ldquo;mirror worlds&rdquo;)
-   Enchanted spaces with inverted colors and special effects

<a id=&ldquo;org776e377&rdquo;></a>

****Current Implementation:****

-   Frontend: React 19 + TypeScript
-   Rendering: SVG with React components (FormPreview)
-   State: Zustand (lightweight, fast)
-   Build: Vite with native SWC compilation
-   Testing: Vitest + React Testing Library
-   PWA: Full service worker support via vite-plugin-pwa

****Future Considerations:****

-   Rendering: PixiJS v8 for canvas-based visuals
-   Animation: GSAP for smooth transitions
-   Physics: Custom spring systems for tactile feedback
-   Geometry: Advanced collision detection for precise touch targeting

See [ARCHITECTURE.org](ARCHITECTURE.md) for complete technical documentation, API details, and design rationale.

<a id=&ldquo;orga549f2f&rdquo;></a>

House of Bao is based on the pioneering work of:

-   ********George Spencer-Brown******** - ****Laws of Form**** (1969)
-   ********William Bricken******** - Iconic Mathematics
-   ********Jeffrey James******** - Applications to computational systems

These thinkers revealed that all mathematics can be derived from three simple axioms. We&rsquo;re making their insights playable.

<a id=&ldquo;orgb3bc5bf&rdquo;></a>

-   [George Spencer Brown Society](<https://lof50.com>)
-   [Iconic Math (William Bricken)](<https://iconicmath.com/>)
-   [William Bricken&rsquo;s Research](<https://wbricken.com/>)
-   [Fast-Growing Hierarchy](<https://cp4space.hatsya.com/2012/12/19/fast-growing-2/>) - Inspiration for advanced mechanics

<a id=&ldquo;org330c71e&rdquo;></a>

Developed by Valerie Kim with contributions from the James Algebra community.

<a id=&ldquo;orgd6221e0&rdquo;></a>

Based on playtest observations: The mobile touch experience has surprising depth. Physical interaction with these mathematical forms creates a stronger learning effect than mouse/keyboard, even on desktop touchscreens.

The skeuomorphic vision is ****magical realist****: these aren&rsquo;t just containers, they&rsquo;re ****spaces**** that can be enchanted. A form like \\\`4\\\*2\\\` shouldn&rsquo;t just be nested boxes—it should show the rounds being manipulated or influenced by the square space they&rsquo;re within, indicating action potential.

The inversion container might access a &ldquo;mirror world&rdquo; where colors invert. The reflection operation might create ghostly mirrored forms that annihilate when they meet. This isn&rsquo;t just UI polish—it&rsquo;s a complete aesthetic reimagining of mathematical operations as lived experience.

Target devices: Mobile phones (iOS/Android) first, tablets naturally follow. The goal is to make algebra feel more natural than memorizing times tables.

&mdash;

****For developers:**** See [ARCHITECTURE.org](ARCHITECTURE.md) for the complete technical documentation and [levels.org](levels.md) for the pedagogical design philosophy.
