/* ==========================================================================
   SIMON NEXUS - GAME ENGINE
   Powered by ES6+, Web Audio API, Canvas Particles, and jQuery.
   ========================================================================== */

$(document).ready(function () {
  // --- STATE VARIABLES ---
  const colors = ["green", "red", "yellow", "blue"];
  let gameSequence = [];
  let userSequence = [];
  let currentRoundIndex = 0;
  
  let isStarted = false;
  let isPlayingSequence = false;
  let isPaused = false;
  let isMuted = false;
  
  let difficulty = "easy"; // easy, medium, hard
  let strictMode = false;
  let practiceMode = false;
  let practiceRetries = 3;
  
  // Game stats
  let stats = {
    highScore: 0,
    gamesPlayed: 0,
    totalScore: 0,
    maxLevel: 0,
    leaderboard: []
  };

  // Sound frequencies
  const frequencies = {
    green: 329.63,  // E4
    red: 261.63,    // C4
    yellow: 392.00,  // G4
    blue: 220.00    // A3
  };

  // Speed configuration (show duration, silence gap)
  const speedConfigs = {
    easy: { duration: 600, gap: 400 },
    medium: { duration: 400, gap: 250 },
    hard: { duration: 250, gap: 150 }
  };

  // Sequence playback timer references
  let sequenceTimers = [];

  // --- AUDIO SYNTHESIS SYSTEM ---
  let audioCtx = null;
  let masterGain = null;

  function initAudio() {
    if (audioCtx) return;
    
    // Create audio context, supporting legacy webkit
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    
    // Set initial mute state
    masterGain.gain.setValueAtTime(isMuted ? 0 : 0.8, audioCtx.currentTime);
  }

  function playTone(freq, type, duration, slideToFreq = null) {
    try {
      initAudio();
      
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      if (slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideToFreq, audioCtx.currentTime + duration);
      }
      
      osc.connect(gainNode);
      gainNode.connect(masterGain);
      
      // Warm synthesizer volume envelope (attack-decay)
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  }

  function playPadSound(color) {
    // Triangle wave provides a warmer retro tone than raw sine waves
    playTone(frequencies[color], "triangle", 0.4);
  }

  function playSuccessSound() {
    // Beautiful ascending major arpeggio chime
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!isPaused && isStarted) {
          playTone(freq, "sine", 0.25);
        }
      }, i * 90);
    });
  }

  function playGameOverSound() {
    // Descending dissonant synth glide
    playTone(196.00, "sawtooth", 0.9, 65.40); // G3 to C2 slide
  }

  function playPracticeFailSound() {
    // Flat buzzer chord
    playTone(130.81, "sawtooth", 0.3);
  }

  function playCountdownBeep(highPitch = false) {
    playTone(highPitch ? 880 : 440, "sine", 0.15);
  }

  // --- CONFETTI PARTICLE SYSTEM (CANVAS) ---
  const canvas = document.getElementById("particles-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let confettiAnimId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class ConfettiParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 5 + 3;
      this.speedX = Math.random() * 8 - 4;
      this.speedY = Math.random() * -8 - 4;
      this.gravity = 0.15;
      this.color = `hsla(${Math.random() * 360}, 90%, 55%, 1)`;
      this.alpha = 1;
      this.decay = Math.random() * 0.012 + 0.008;
    }

    update() {
      this.speedY += this.gravity;
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function triggerConfetti() {
    particles = [];
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial blast from center-screen
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2 - 80;
    for (let i = 0; i < 180; i++) {
      particles.push(new ConfettiParticle(startX, startY));
    }

    let startTime = Date.now();
    const spawnDuration = 1800; // continue spawning for 1.8 seconds

    function animateConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Date.now() - startTime < spawnDuration) {
        // Add random fountains from the bottom corners
        if (Math.random() < 0.4) {
          particles.push(new ConfettiParticle(0, canvas.height));
          particles.push(new ConfettiParticle(canvas.width, canvas.height));
        }
      }

      particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) {
          particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        confettiAnimId = requestAnimationFrame(animateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.removeEventListener("resize", resizeCanvas);
      }
    }

    cancelAnimationFrame(confettiAnimId);
    animateConfetti();
  }

  // --- STATS & LEADERBOARD DATA MANAGER ---
  function loadLocalData() {
    const savedStats = localStorage.getItem("simon_nexus_stats");
    if (savedStats) {
      try {
        stats = JSON.parse(savedStats);
      } catch (e) {
        console.error("Local storage corruption, resetting stats:", e);
      }
    }
    
    // Ensure all attributes exist
    if (!stats.highScore) stats.highScore = 0;
    if (!stats.gamesPlayed) stats.gamesPlayed = 0;
    if (!stats.totalScore) stats.totalScore = 0;
    if (!stats.maxLevel) stats.maxLevel = 0;
    if (!stats.leaderboard) stats.leaderboard = [];

    updateUIStats();
    updateUILeaderboard();
  }

  function saveLocalData() {
    localStorage.setItem("simon_nexus_stats", JSON.stringify(stats));
    updateUIStats();
  }

  function updateUIStats() {
    $("#highScoreDisplay").text(padZero(stats.highScore, 3));
    $("#statsGamesPlayed").text(stats.gamesPlayed);
    $("#statsMaxLevel").text(stats.maxLevel);
    
    const avg = stats.gamesPlayed > 0 ? (stats.totalScore / stats.gamesPlayed).toFixed(1) : "0.0";
    $("#statsAvgScore").text(avg);

    // Update Achievement Badges
    updateBadges(stats.maxLevel);
  }

  function updateBadges(maxLvl) {
    const badges = [
      { id: "#badge-bronze", req: 5 },
      { id: "#badge-silver", req: 10 },
      { id: "#badge-gold", req: 15 },
      { id: "#badge-ruby", req: 20 }
    ];

    badges.forEach(b => {
      const el = $(b.id);
      if (maxLvl >= b.req) {
        if (el.hasClass("locked")) {
          el.removeClass("locked").addClass("unlocked");
          // Visual achievement unlock flash animation
          el.css("animation", "badgeUnlockAnim 0.6s ease-out");
        }
      } else {
        el.removeClass("unlocked").addClass("locked");
        el.css("animation", "");
      }
    });
  }

  function updateUILeaderboard() {
    const body = $("#leaderboardBody");
    body.empty();

    if (stats.leaderboard.length === 0) {
      body.append('<tr class="empty-row"><td colspan="4">No scores logged yet</td></tr>');
      return;
    }

    stats.leaderboard.forEach((entry, index) => {
      const posClass = index < 3 ? `pos-badge pos-${index + 1}` : "pos-badge";
      body.append(`
        <tr>
          <td><span class="${posClass}">${index + 1}</span></td>
          <td style="font-weight: 600; text-transform: uppercase;">${entry.name}</td>
          <td>Lvl ${entry.level}</td>
          <td style="font-family: var(--font-digital); font-weight: bold; color: var(--accent);">${entry.score}</td>
        </tr>
      `);
    });
  }

  function checkLeaderboardQualify(score) {
    if (score <= 0) return false;
    if (stats.leaderboard.length < 5) return true;
    return score > stats.leaderboard[stats.leaderboard.length - 1].score;
  }

  function insertLeaderboardEntry(name, level, score) {
    const newEntry = {
      name: name.slice(0, 3).toUpperCase(),
      level: level,
      score: score,
      date: new Date().toLocaleDateString()
    };

    stats.leaderboard.push(newEntry);
    // Sort descending by score, then by level
    stats.leaderboard.sort((a, b) => b.score - a.score || b.level - a.level);
    // Keep top 5
    stats.leaderboard = stats.leaderboard.slice(0, 5);

    saveLocalData();
    updateUILeaderboard();
  }

  // --- CORE GAME ENGINE CONTROLLERS ---
  
  function flashPad(color) {
    const el = $("#" + color);
    el.addClass("flash");
    playPadSound(color);
    
    const config = speedConfigs[difficulty];
    setTimeout(() => {
      el.removeClass("flash");
    }, config.duration);
  }

  function updateDashboard() {
    $("#levelDisplay").text(padZero(gameSequence.length, 2));
    $("#scoreDisplay").text(padZero(userSequence.length, 3));
    
    // Progress Bar scaling
    // Grows in percentage based on completion of current sequence round
    const progress = gameSequence.length > 0 ? (currentRoundIndex / gameSequence.length) * 100 : 0;
    $("#gameProgressBar").css("width", `${progress}%`);
  }

  function clearSequenceTimers() {
    sequenceTimers.forEach(t => clearTimeout(t));
    sequenceTimers = [];
  }

  function playSequence() {
    if (!isStarted || isPaused) return;

    isPlayingSequence = true;
    currentRoundIndex = 0;
    updateStatus("WATCH");
    updateDashboard();
    
    // Disable pause during sequence to avoid timing corruption
    $("#pauseGameBtn").prop("disabled", true);

    const config = speedConfigs[difficulty];
    const stepInterval = config.duration + config.gap;

    clearSequenceTimers();

    gameSequence.forEach((color, index) => {
      const timer = setTimeout(() => {
        if (!isPaused && isStarted) {
          flashPad(color);
          
          // Last element completed
          if (index === gameSequence.length - 1) {
            const endTimer = setTimeout(() => {
              if (!isPaused && isStarted) {
                isPlayingSequence = false;
                updateStatus("YOUR TURN");
                $("#pauseGameBtn").prop("disabled", false);
              }
            }, config.duration + 200);
            sequenceTimers.push(endTimer);
          }
        }
      }, index * stepInterval);
      
      sequenceTimers.push(timer);
    });
  }

  function generateNextRound() {
    if (!isStarted || isPaused) return;
    
    userSequence = [];
    currentRoundIndex = 0;
    
    const colorsList = ["green", "red", "yellow", "blue"];
    const randomColor = colorsList[Math.floor(Math.random() * 4)];
    gameSequence.push(randomColor);
    
    updateDashboard();
    
    // Play success chime after completing round (except round 1)
    if (gameSequence.length > 1) {
      updateStatus("GOOD!");
      playSuccessSound();
      
      // Delay playing sequence so the chime finishes
      setTimeout(() => {
        playSequence();
      }, 700);
    } else {
      setTimeout(() => {
        playSequence();
      }, 300);
    }
  }

  function handlePadClick(color) {
    if (!isStarted || isPlayingSequence || isPaused) return;
    
    flashPad(color);
    userSequence.push(color);
    currentRoundIndex = userSequence.length;
    updateDashboard();

    const expectedColor = gameSequence[userSequence.length - 1];

    if (color === expectedColor) {
      // Input match success
      if (userSequence.length === gameSequence.length) {
        // Round completed successfully
        isPlayingSequence = true; // Block user input
        $("#pauseGameBtn").prop("disabled", true);
        setTimeout(generateNextRound, 800);
      }
    } else {
      // Input mismatch failure
      handleFailure();
    }
  }

  function handleFailure() {
    isPlayingSequence = true;
    $("#pauseGameBtn").prop("disabled", true);
    
    // Shake Simon Board UI
    $(".simon-board").addClass("shake-error");
    setTimeout(() => {
      $(".simon-board").removeClass("shake-error");
    }, 500);

    if (practiceMode && practiceRetries > 1) {
      // Practice retry fallback
      practiceRetries--;
      playPracticeFailSound();
      updatePracticeHearts();
      updateStatus("TRY AGAIN!");
      
      setTimeout(() => {
        updateStatus("WATCH");
        playSequence();
      }, 1200);
    } else {
      // Game Over
      triggerGameOver();
    }
  }

  function updatePracticeHearts() {
    const hearts = $("#retriesIndicator .heart-icons i");
    hearts.each(function (index) {
      if (index < practiceRetries) {
        $(this).addClass("active-heart");
      } else {
        $(this).removeClass("active-heart");
      }
    });
  }

  function startCountdown(callback) {
    $("#countdownOverlay").removeClass("hidden");
    let count = 3;
    $("#countdownNumber").text(count);
    playCountdownBeep(false);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        $("#countdownNumber").text(count);
        playCountdownBeep(false);
      } else if (count === 0) {
        $("#countdownNumber").text("GO!");
        playCountdownBeep(true);
      } else {
        clearInterval(interval);
        $("#countdownOverlay").addClass("hidden");
        callback();
      }
    }, 900);
  }

  function startNewGame() {
    initAudio();
    clearSequenceTimers();
    
    isStarted = true;
    isPaused = false;
    isPlayingSequence = true;
    gameSequence = [];
    userSequence = [];
    currentRoundIndex = 0;
    
    // Reset practice settings
    practiceMode = $("#practiceModeToggle").is(":checked");
    strictMode = $("#strictModeToggle").is(":checked");
    practiceRetries = 3;

    if (practiceMode) {
      updatePracticeHearts();
      $("#retriesIndicator").removeClass("hidden");
    } else {
      $("#retriesIndicator").addClass("hidden");
    }

    // Toggle interactive options panels
    disableParameters(true);
    $("#startGameBtn").html('<i class="fa-solid fa-arrow-rotate-right"></i> Restart').removeClass("primary-action").addClass("danger-btn");
    $("#pauseGameBtn").prop("disabled", true).html('<i class="fa-solid fa-pause"></i> Pause');

    updateDashboard();
    updateStatus("COUNTDOWN");

    startCountdown(() => {
      generateNextRound();
    });
  }

  function togglePause() {
    if (!isStarted || isPlayingSequence) return;

    if (isPaused) {
      // Resume Game
      isPaused = false;
      updateStatus("YOUR TURN");
      $("#pauseGameBtn").html('<i class="fa-solid fa-pause"></i> Pause');
      $("#tipsText").text("Play the sequence. Strict mode resets the game on single errors.");
      playSequence(); // Replay current round's sequence to guide player
    } else {
      // Pause Game
      isPaused = true;
      clearSequenceTimers();
      updateStatus("PAUSED");
      $("#pauseGameBtn").html('<i class="fa-solid fa-play"></i> Resume');
      $("#tipsText").text("Game paused. Tap Resume to show sequence and start playing.");
    }
  }

  function triggerGameOver() {
    isStarted = false;
    isPlayingSequence = false;
    clearSequenceTimers();
    playGameOverSound();
    updateStatus("GAME OVER");

    // Process statistics
    const finalScore = Math.max(0, gameSequence.length - 1);
    const finalLevel = Math.max(1, gameSequence.length);

    stats.gamesPlayed++;
    stats.totalScore += finalScore;
    if (finalLevel > stats.maxLevel) {
      stats.maxLevel = finalLevel;
    }

    let isNewHigh = false;
    if (finalScore > stats.highScore) {
      stats.highScore = finalScore;
      isNewHigh = true;
    }

    saveLocalData();

    // Configure Modal Data
    $("#modalScore").text(padZero(finalScore, 3));
    $("#modalLevel").text(padZero(finalLevel, 2));
    $("#modalBest").text(padZero(stats.highScore, 3));

    if (isNewHigh) {
      $("#highScoreRecordCard").addClass("highlight-card");
      $("#highScoreBanner").removeClass("hidden");
      // Trigger canvas celebration confetti
      triggerConfetti();
    } else {
      $("#highScoreRecordCard").removeClass("highlight-card");
      $("#highScoreBanner").addClass("hidden");
    }

    // Check leaderboard qualification
    if (checkLeaderboardQualify(finalScore)) {
      $("#leaderboardEntryForm").removeClass("hidden");
      $("#playerInitials").val("").focus();
    } else {
      $("#leaderboardEntryForm").addClass("hidden");
    }

    // Toggle Start button text back to ready state
    $("#startGameBtn").html('<i class="fa-solid fa-play"></i> Start Game').removeClass("danger-btn").addClass("primary-action");
    $("#pauseGameBtn").prop("disabled", true);
    disableParameters(false);

    // Open Modal with blur transit overlay
    $("#gameOverModal").removeClass("hidden");
  }

  function disableParameters(disable) {
    $(".diff-btn").prop("disabled", disable);
    $("#strictModeToggle").prop("disabled", disable);
    $("#practiceModeToggle").prop("disabled", disable);
    if (disable) {
      $(".difficulty-switch").css("opacity", "0.5");
    } else {
      $(".difficulty-switch").css("opacity", "1");
    }
  }

  function updateStatus(status) {
    const statusMap = {
      READY: { text: "READY", color: "var(--text-secondary)" },
      COUNTDOWN: { text: "PREPARE", color: "var(--accent)" },
      WATCH: { text: "WATCH", color: "var(--accent)" },
      "YOUR TURN": { text: "YOUR TURN", color: "var(--color-green-on)" },
      GOOD: { text: "EXCELLENT", color: "var(--color-blue-on)" },
      "TRY AGAIN": { text: "TRY AGAIN", color: "var(--color-yellow-on)" },
      PAUSED: { text: "PAUSED", color: "var(--text-muted)" },
      "GAME OVER": { text: "GAME OVER", color: "#ef4444" }
    };

    const val = statusMap[status] || { text: status, color: "var(--text-primary)" };
    $("#centerStatus").text(val.text).css("color", val.color);
  }

  // --- BUTTON EVENT BINDINGS (JQUERY) ---

  // Pad events
  $(".pad").on("mousedown", function () {
    const color = $(this).attr("id");
    handlePadInput(color);
  });

  function handlePadInput(color) {
    if (!isStarted || isPlayingSequence || isPaused) return;
    handlePadClick(color);
  }

  // Game controls
  $("#startGameBtn").on("click", function () {
    startNewGame();
  });

  $("#pauseGameBtn").on("click", function () {
    togglePause();
  });

  // Sound switch
  $("#muteToggleBtn").on("click", function () {
    isMuted = !isMuted;
    if (isMuted) {
      $(this).html('<i class="fa-solid fa-volume-xmark"></i>').addClass("secondary-action");
      if (masterGain) masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
      $(this).html('<i class="fa-solid fa-volume-high"></i>').removeClass("secondary-action");
      if (masterGain) masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    }
  });

  // Parameter Switches
  $(".diff-btn").on("click", function () {
    if (isStarted) return;
    $(".diff-btn").removeClass("active");
    $(this).addClass("active");
    difficulty = $(this).data("difficulty");
    
    const messages = {
      easy: "Slow speed. Great for practice and developers starting out.",
      medium: "Standard speed. The benchmark mode for neural synapse testing.",
      hard: "Maximum speed! Sharp chimes. Challenge your limits."
    };
    $("#tipsText").text(messages[difficulty]);
  });

  $("#strictModeToggle").on("change", function () {
    if ($(this).is(":checked")) {
      $("#practiceModeToggle").prop("checked", false).trigger("change");
      $("#tipsText").text("Strict Mode activated: One false sequence and it's instant Game Over!");
    }
  });

  $("#practiceModeToggle").on("change", function () {
    if ($(this).is(":checked")) {
      $("#strictModeToggle").prop("checked", false).trigger("change");
      $("#tipsText").text("Practice Mode activated: You get 3 retries. Scores are still logged.");
    }
  });

  // Reset leaderboard statistics
  $("#resetStatsBtn").on("click", function () {
    if (confirm("Are you sure you want to reset all game history, high scores, achievements, and local leaderboard records? This cannot be undone.")) {
      stats = {
        highScore: 0,
        gamesPlayed: 0,
        totalScore: 0,
        maxLevel: 0,
        leaderboard: []
      };
      saveLocalData();
      updateUILeaderboard();
      alert("Leaderboard and developer stats have been successfully reset.");
    }
  });

  // Leaderboard submit form handler
  $("#submitScoreBtn").on("click", function () {
    const name = $("#playerInitials").val().trim();
    if (!name || name.length === 0) {
      alert("Please enter 1 to 3 characters for your leaderboard profile.");
      return;
    }
    
    const finalScore = Math.max(0, gameSequence.length - 1);
    const finalLevel = Math.max(1, gameSequence.length);
    
    insertLeaderboardEntry(name, finalLevel, finalScore);
    $("#leaderboardEntryForm").addClass("hidden");
  });

  // Modal actions
  $("#modalPlayAgainBtn").on("click", function () {
    $("#gameOverModal").addClass("hidden");
    startNewGame();
  });

  $("#modalCloseBtn").on("click", function () {
    $("#gameOverModal").addClass("hidden");
  });

  $("#keyboardHelpBtn").on("click", function () {
    $("#keyboardHelpModal").removeClass("hidden");
  });

  $("#closeHelpBtn").on("click", function () {
    $("#keyboardHelpModal").addClass("hidden");
  });

  // Close modals when clicking overlay backdrop
  $(".modal-overlay").on("click", function (e) {
    if (e.target === this) {
      $(this).addClass("hidden");
    }
  });

  // --- THEME SWAP MODULE ---
  $("#themeToggleBtn").on("click", function () {
    toggleTheme();
  });

  function toggleTheme() {
    const body = $("body");
    if (body.hasClass("dark-theme")) {
      body.removeClass("dark-theme").addClass("light-theme");
      $("#themeToggleBtn").html('<i class="fa-solid fa-sun"></i>');
    } else {
      body.removeClass("light-theme").addClass("dark-theme");
      $("#themeToggleBtn").html('<i class="fa-solid fa-moon"></i>');
    }
  }

  // --- ACCESSIBILITY KEYBOARD CONTROLLER ---
  $(document).on("keydown", function (e) {
    // Prevent default actions for spacer space and arrows during active gameplay
    if (isStarted && !isPaused && (e.key === " " || e.key.startsWith("Arrow"))) {
      e.preventDefault();
    }

    const key = e.key.toLowerCase();
    
    // Game activation triggers (Enter or Space)
    if ((e.key === "Enter" || e.key === " ") && !isStarted && !$("#gameOverModal").is(":visible") && !$("#keyboardHelpModal").is(":visible")) {
      startNewGame();
      return;
    }

    // Modal action keybindings
    if (e.key === "Escape") {
      $("#gameOverModal").addClass("hidden");
      $("#keyboardHelpModal").addClass("hidden");
      return;
    }

    // Action shortcuts
    if (key === "p") {
      togglePause();
      return;
    }
    if (key === "m") {
      $("#muteToggleBtn").trigger("click");
      return;
    }
    if (key === "t") {
      toggleTheme();
      return;
    }

    // Pad inputs mapping Q-W-A-S & Arrow keys
    if (!isStarted || isPlayingSequence || isPaused) return;

    const padMap = {
      q: "green",
      arrowup: "green",
      w: "red",
      arrowright: "red",
      a: "yellow",
      arrowleft: "yellow",
      s: "blue",
      arrowdown: "blue"
    };

    if (padMap[key]) {
      handlePadInput(padMap[key]);
    }
  });

  // --- GENERAL HELPER FUNCTION ---
  function padZero(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

  // Initialize Data
  loadLocalData();
});
