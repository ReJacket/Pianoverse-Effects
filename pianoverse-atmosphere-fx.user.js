// ==UserScript==
// @name         Pianoverse Atmosphere FX
// @namespace    http://tampermonkey.net/
// @version      12.0
// @match        *://pianoverse.net/*
// @grant        none
// @Creator CharaChocolat =) greetings!
// ==/UserScript==

(function() {
    'use strict';

    let effectsEnabled = {
        rain: false,
        splash: false,
        stars: false,
        comet: false
    };

   function playSoftClick(){
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();

    o1.type = "sine";
    o2.type = "sine";

    o1.frequency.value = 700;
    o2.frequency.value = 900;

    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    o1.start();
    o2.start();

    o1.stop(ctx.currentTime + 0.08);
    o2.stop(ctx.currentTime + 0.08);
}
    function playStartupSound(){
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.type = "sine";
        o.frequency.setValueAtTime(600, ctx.currentTime);
        o.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.1);

        g.gain.value = 0.015;

        o.connect(g);
        g.connect(ctx.destination);

        o.start();
        o.stop(ctx.currentTime + 0.12);
    }

    function createUI() {
        const panel = document.createElement("div");

        Object.assign(panel.style, {
            position: "fixed",
            right: "20px",
            bottom: "100px",
            padding: "12px",
            borderRadius: "12px",
            background: "rgba(20,20,30,0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "13px",
            zIndex: "9999",
            fontFamily: "sans-serif"
        });

        panel.innerHTML = `
            <label><input type="checkbox" id="fx-stars"> Stars</label><br>
            <label><input type="checkbox" id="fx-rain"> Rain</label><br>
            <label><input type="checkbox" id="fx-splash"> Splash</label><br>
            <label><input type="checkbox" id="fx-comet"> Comet</label>
        `;

        document.body.appendChild(panel);

        function createWarning(text, color, offset){
            const el = document.createElement("div");

            Object.assign(el.style, {
                position: "fixed",
                top: `${20 + offset}px`,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "10px 20px",
                borderRadius: "14px",
                background: color,
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "14px",
                zIndex: "9999",
                opacity: "0",
                transition: "opacity 0.4s ease"
            });

            el.innerText = text;
            document.body.appendChild(el);

            let timeout;

            return function(){
                clearTimeout(timeout);
                el.style.opacity = "1";

                timeout = setTimeout(()=>{
                    el.style.opacity = "0";
                },2500);
            };
        }

        const greenWelcome = createWarning(
            "👋 Welcome! Enable effects using the toggles below :)",
            "rgba(80,255,120,0.25)",
            0
        );

        const redWarning = createWarning(
            "⚠ Stars + Rain may cause visual conflict",
            "rgba(255,80,80,0.25)",
            0
        );

        const yellowWarning = createWarning(
            "⚠ To use Splash, please enable Rain!",
            "rgba(255,200,50,0.25)",
            60
        );

        function updateWarnings(){
            if(effectsEnabled.rain && effectsEnabled.stars){
                redWarning();
            }

            if(effectsEnabled.splash && !effectsEnabled.rain){
                yellowWarning();
            }
        }

        greenWelcome();
        playStartupSound();

        panel.querySelector("#fx-stars").onchange = e => {
            playSoftClick();
            effectsEnabled.stars = e.target.checked;
            updateWarnings();
        };

        panel.querySelector("#fx-rain").onchange = e => {
            playSoftClick();
            effectsEnabled.rain = e.target.checked;
            updateWarnings();
        };

        panel.querySelector("#fx-splash").onchange = e => {
            playSoftClick();
            effectsEnabled.splash = e.target.checked;
            updateWarnings();
        };

        panel.querySelector("#fx-comet").onchange = e => {
            playSoftClick();
            effectsEnabled.comet = e.target.checked;
        };
    }

    function createStars(){/* ... trimmed for brevity in repo version? */}

    function createRain(){/* ... */}

    function createComet(){/* ... */}

    createUI();
    createStars();
    createRain();
    createComet();

})();