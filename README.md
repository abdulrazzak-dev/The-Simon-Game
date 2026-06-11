# The Simon Game 🎮

A web based replica of the classic Simon memory game. The game generates a random sequence of colors and sounds, and the player must recall and repeat the pattern. As the player progresses, the sequence gets longer and faster, challenging their memory and concentration.

🚀 **Live Demo:** [Play The Simon Game Here](https://abdulrazzak-dev.github.io/The-Simon-Game/)

---

## 🕹️ How to Play

1. **Start the Game:** Press any key on your keyboard or click the **"Start Game"** button to begin.
2. **Watch the Pattern:** The game will flash a button and play a sound. This is the first step of the sequence.
3. **Repeat the Pattern:** Click the correct color button that flashed.
4. **Advance to Next Level:** Every time you successfully repeat the pattern, the game will add one more random flash/sound to the sequence.
5. **Game Over:** If you click the wrong color, the screen will flash red, a game-over sound will play, and your final score will be displayed. You can press any key or click the button to restart!

---

## ✨ Features

- **Interactive UI:** Smooth button-flash animations when clicked or triggered by the game.
- **Audio Feedback:** Distinct sound effects for each individual color button and a dedicated game-over sound.
- **Score Tracking:** Keeps track of your current score during gameplay.
- **Responsive Design:** Works on both desktop and mobile devices.

---

## 🛠️ Technologies Used

- **HTML5:** For structuring the game board, buttons, and text layouts.
- **CSS3:** For styling, colors, grid layout, and custom flash animations.
- **JavaScript (ES6):** For handling game logic, state management, event listeners, and audio playback.

---

## 📁 Project Structure

```text
├── index.html          # The main HTML structure
├── styles.css          # Game layout, styling, and animations
├── index.js            # Game logic and sequence generation
└── sounds/             # Folder containing game audio files (.mp3)
    ├── green.mp3
    ├── red.mp3
    ├── yellow.mp3
    ├── blue.mp3
    └── wrong.mp3
