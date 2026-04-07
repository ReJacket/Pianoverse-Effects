# 🎹 Pianoverse Atmosphere FX

A lightweight Tampermonkey script that adds immersive visual and audio effects to [pianoverse.net](https://pianoverse.net/).

Created by **CharaChocolat =) Greetings**

---

## ✨ Features

- 🌧️ Rain effect with optional splash particles
- ⭐ Dynamic stars with interactive movement (click to change pattern)
- ☄️ Random comet animation across the screen
- 🎵 Soft UI sound feedback (designed to be pleasant and subtle)
- 🧊 Glass-style control panel with blur effect
- ⚠️ Smart warnings for conflicting effects

---

## 🎛️ Controls

A floating panel appears on the bottom-right of the screen with toggles:

- **Stars** → Enables animated star field
- **Rain** → Enables rain effect
- **Splash** → Adds splash particles (requires Rain)
- **Comet** → Enables occasional comet animation

---

## ⚠️ Notes

- Using **Stars + Rain together** may cause visual overlap
- **Splash requires Rain** to be enabled
- Effects are disabled by default for better user control

---

## 🔊 Audio Design

The UI uses soft synthesized tones instead of harsh clicks:
- Startup sound: quick rising tone
- Toggle sound: smooth dual-frequency tap

Designed to feel light and non-intrusive.

---

## 🚀 Installation

1. Install **Tampermonkey** extension
2. Click this link (or paste script manually):
   - `pianoverse-atmosphere-fx.user.js`
3. Open: https://pianoverse.net/
4. Enable effects using the panel

---

## 🛠️ How it Works

- Uses **HTML Canvas** for rendering all visual effects
- Independent rendering loops for:
  - Stars
  - Rain + Splash
  - Comet
- Lightweight physics simulation for natural motion
- Web Audio API for UI feedback sounds

---

## 💡 Future Ideas

- Custom themes (color variations)
- Wind affecting rain direction
- Ambient background audio (optional)
- Performance toggle (low/high)

---

## 📜 License

MIT License — feel free to use, modify and share.

---

## ❤️ Credits

Created by **CharaChocolat =) Greetings**
