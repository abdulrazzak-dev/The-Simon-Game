# Simon Nexus 🎮

A premium, modern web-based reimagining of the classic Simon memory game. Built with HTML5, CSS3, ES6+, and jQuery, this application is engineered to showcase advanced front-end development, responsive grid design, fluid micro-animations, custom sound synthesis, and rich UI/UX aesthetics.

🚀 **Live Demo:** [Play Simon Nexus Here](https://abdulrazzak-dev.github.io/The-Simon-Game/)

---

## 🕹️ Game Features

### 1. Modern UI/UX Glassmorphism
- **Premium Themes:** Sleek dark mode (default) and crisp light mode toggle.
- **Glassmorphic Cards:** Translucent panels with background blurs, subtle borders, and HSL color-matched glowing shadows.
- **Micro-Animations:** Fluid scaling transitions, glowing buttons, error-state board shakes, and high-score celebrations.
- **Fully Responsive:** Adapts seamlessly across desktop, tablet, and mobile displays.

### 2. Gameplay Enhancements & Modes
- **Difficulty Modes:**
  - **Easy:** Relaxed playback speed (1000ms interval).
  - **Medium:** Standard speed (700ms interval).
  - **Hard:** High-speed challenge (450ms interval) to test reflex and memory.
- **Strict Mode:** Single error resets the run. Excellent for competitive scores.
- **Practice Mode:** Grants 3 retry lives (hearts) per run, allowing you to replay sequences on mistake.
- **Pause & Resume:** Freeze gameplay anytime during your turn, resume to replay the current sequence.
- **Start Countdown:** Immersive 3-2-1 visual and sound countdown before gameplay begins.

### 3. Audio & Graphics Synthesis
- **Web Audio API Synth:** Chimes are synthesized dynamically using oscillators and envelope gains. Zero asset load latency.
- **Custom Melodies:** Unique pad chimes, an ascending arpeggio for level completions, and a sliding frequency sweep for game-over.
- **Particle System:** A custom Canvas-based confetti explosion celebrating new personal best high scores.

### 4. Leaderboard & Stats
- **Local Leaderboard:** Persistent Top 5 local records with player initials.
- **Developer Stats:** Displays Games Played, Average Score, and Max Level reached.
- **Achievements:** Unlockable badges (Bronze: Level 5, Silver: Level 10, Gold: Level 15, Ruby: Level 20).

---

## ⌨️ Keyboard Controls

Play without a mouse! The game features full keyboard support:

| Action | Key Mappings |
| :--- | :--- |
| **Green Pad** | `Q` or `↑` (Up Arrow) |
| **Red Pad** | `W` or `→` (Right Arrow) |
| **Yellow Pad** | `A` or `←` (Left Arrow) |
| **Blue Pad** | `S` or `↓` (Down Arrow) |
| **Start / Restart** | `Enter` or `Space` |
| **Pause / Resume** | `P` |
| **Mute / Unmute** | `M` |
| **Toggle Theme** | `T` |

---

## 📁 File Structure

```text
├── index.html          # Structure, dashboard controls, leaderboard, and modals
├── stylesheet.css      # Custom variables, glassmorphic styles, responsive grids, and animations
└── app.js              # State machine, Web Audio synth, canvas particles, and jQuery DOM binders
```

---

## 🛠️ Built With

- **HTML5 & Semantic Elements**
- **CSS3 Variables & Grid/Flexbox Layouts**
- **JavaScript (ES6+)**
- **jQuery** - For fluid transitions, DOM scripting, and event mappings
- **Web Audio API** - For asset-free sound wave synthesis
- **HTML5 Canvas** - For physics-based confetti particle simulation
