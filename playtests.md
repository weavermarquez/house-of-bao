1.  [Build 1](#org6f55574)
    1.  [Playtest 1](#orgfb12f5c)
        1.  [Notes while I watched](#orga09c3b9)
        2.  [Transcript](#org90e1d8f):ARCHIVE:
    2.  [Playtest 2](#org9bc4e5a)
        1.  [Notes while I watched](#org19e8188)
        2.  [Where Ember Sees This Going](#org0027cb7)
        3.  [Transcript](#orga8a5db0):ARCHIVE:

<a id=&ldquo;org6f55574&rdquo;></a>

<a id=&ldquo;orgfb12f5c&rdquo;></a>

\## Playtest 1

<a id=&ldquo;orga09c3b9&rdquo;></a>

\### Notes while I watched

1.  UI Definitely needs to go bye-bye!
2.  Attempted to disperse on Square of a Frame.
3.  yay? but too simple to convey much useful information
4.  Clarify needs The gradient seems notable to the player.
5.  Doesn&rsquo;t understand why **cancel** is valid on selection of only \`o\` without both \`o\`, \`<o>\`
6.  Yay.
7.  Wants to disperse on the square. Confused on how/why Disperse duplicates context.
8.  \`4-2\` :: Tried to cancel on the <o\\\*o\\\*>\\\* but confused why it expected only parent. Asked, **why** did they cancel?
9.  \`4x2\` :: a little overwhelming? Trying to read how multiplication arises from this shape. Clarify didn&rsquo;t work; it should be disabled when user selects invalid parent (()[])\\\*
    
    Dispersal leads to too many extra circles that it feels wrong?
    
    -   still confusced on what the actions mean.
    
    Trying to click to see what actions are available on various selections. Expects more accurate narrowing. **Collect** was NOT sufficiently covered in the tutorial examples!! Collect is the one with most selections: it needs minmum of 2 or 3 containers selected.
    
    Confusion on use of **Cancel** hoping it would **clarify**.
    
    Now attempting to randomly click on objects until **collect** appears.
    
    -   [ ] Remove Reflection Axiom for level \`4x2\`
    
    Confusion led to forgetting what the rules do.

<a id=&ldquo;org90e1d8f&rdquo;></a>

\### Transcript :ARCHIVE:

<a id=&ldquo;org9bc4e5a&rdquo;></a>

\## Playtest 2

<a id=&ldquo;org19e8188&rdquo;></a>

\### Notes while I watched

This time mostly quotes.

1.  Aww yeah
2.  mhm
3.  create?
4.  confused on whether a &rsquo;void goal&rsquo; is loading or just nothing
5.  the edges reaching beyond the top of the screen is intriguing. But why can&rsquo;t I see what it&rsquo;s attached to? I&rsquo;d like to see the parent object (a void node) and to see the void, maybe a black hole?
6.  straightforward. But why are the axioms called that, and what do they represent?
7.  hmm. disperse? redundancy is nice.
8.  nice. interesting eureka!
9.  \`4x2\` too many options. not obvious to me. Oops, dispersed too much (to eight pairs of empty frames) Clearing the selection by accidentally clicking the background doesn&rsquo;t feel good.
10. \`4/2\` Visual indication would be nice of how **cancel** won&rsquo;t work. val: >\\\_> too much jump in difficulty from \`4x2\` to \`4/2\` for sure. collect & enfold (esp. the difference between Mark and Frame) was NOT explained well at all in previous levels.
    
    <skip>
11. Created an octopus, lol
12. If only we could clear **all** eight pairs at the same time. That would feel ****satisfying****, like a Tetris. To be able to multiselect many pairs and to clarify them all at once.

<end>

<a id=&ldquo;org0027cb7&rdquo;></a>

\### Where Ember Sees This Going

This game doesn&rsquo;t need physics? It think it&rsquo;d be great if it could run on absolutely minimal hardware. Simplicity! Good **animation** physics or tweening instead. For a simple game like this it&rsquo;s best to keep it as simple as possible.

Imagining Axiom Actions: pop-up bar of all actions on each specific elements availabl ethere.

Use Icons and Text? Click then select menu is context dependent, and limits the choices. Good.

Error tooltips would be great as to why an action won&rsquo;t work or is unsafe. It&rsquo;ll help the game be less front-loaded with tutorials, too.

The Gameplay Loop: Click -> see available actions -> try an action

1.  Idea: What sort of new mechanics would even be possible?
    
    Say 1/2 of these circles are one part of two halves. And when combined they do something new to the game? the JA system?
    
    e.g. take **A** and give it custom conditions.
    
    -   goal states can be not necessarily **void** or **simplify**
    -   new types of goal states are itself a mechanic.
    -   new ideas or actions?

2.  &ldquo;I don&rsquo;t know if the possibility space is that broad? But it is **interesting**.&rdquo;
    
    Stephens Sausage Roll is interesting because just moving around is not simple, with a fork the same size as you. And combined with the water, sausages, and grill, it&rsquo;s a challenge to get around. It&rsquo;s a 2-dimensional problem.
    
    House of Bao is just one dimension at the moment because it&rsquo;s mostly about the JA system. It doesn&rsquo;t need a second half? It is a very good idea that deserves the spotlight.
    
    Games like Solitaire are interesting at one dimension. You should make a very good solitaire!
    
    A new axiom: moves taken?
    
    -   what if after X moves you add a new piece that would require new forethought?
        -   this would involve making new distinctions in types of boundaries, which is scawy&hellip;

<a id=&ldquo;orga8a5db0&rdquo;></a>

\### Transcript :ARCHIVE:
