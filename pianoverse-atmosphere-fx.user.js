// ==UserScript==
// @name         Pianoverse Atmosphere FX v13 (UI Slide + Save + Reactive Stars)
// @namespace    http://tampermonkey.net/
// @version      13.4
// @match        *://pianoverse.net/*
// @grant        none
// @creator      CharaChocolat =) greetings!
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = "pv_fx_settings_v13";

    let effectsEnabled = loadSettings();

    function loadSettings(){
        try{
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Object.assign({
                rain:false,
                splash:false,
                stars:false,
                comet:false,
                simplify:false,
                warnings:true
            }, saved || {});
        }catch{
            return {
                rain:false,
                splash:false,
                stars:false,
                comet:false,
                simplify:false,
                warnings:true
            };
        }
    }

    function saveSettings(){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(effectsEnabled));
    }

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

    let audioCtx, analyser, dataArray;

    function setupAudioAnalysis(){
        if(window.__pianoverseAnalyser) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        window.__pianoverseAnalyser = analyser;
    }

    function getAudioLevel(){
        if(!window.__pianoverseAnalyser) return 0;

        window.__pianoverseAnalyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for(let i = 0; i < dataArray.length; i++){
            sum += dataArray[i];
        }

        return sum / dataArray.length / 255;
    }

    function createUI() {
        const wrapper = document.createElement("div");

        Object.assign(wrapper.style, {
            position: "fixed",
            right: "0px",
            bottom: "160px",
            zIndex: "9999",
            display: "flex",
            alignItems: "center"
        });

        const arrow = document.createElement("div");
        arrow.innerText = "<";

        Object.assign(arrow.style, {
            background: "rgba(20,20,30,0.85)",
            color: "white",
            padding: "10px",
            borderRadius: "12px 0 0 12px",
            cursor: "pointer",
            userSelect: "none"
        });

        const panel = document.createElement("div");

        Object.assign(panel.style, {
            width: "0px",
            overflow: "hidden",
            borderRadius: "12px 0 0 12px",
            background: "rgba(20,20,30,0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "13px",
            transition: "all 0.25s ease",
            fontFamily: "sans-serif"
        });

        panel.innerHTML = `
            <div style="padding:12px;">
                <label><input type="checkbox" id="fx-stars"> Stars</label><br>
                <label><input type="checkbox" id="fx-rain"> Rain</label><br>
                <label><input type="checkbox" id="fx-splash"> Splash</label><br>
                <label><input type="checkbox" id="fx-comet"> Comet</label><br>
                <label><input type="checkbox" id="fx-simplify"> Simple Effects</label><br>
                <label><input type="checkbox" id="fx-warnings"> Disable Conflict Warnings</label>
            </div>
        `;

        let open = false;

        arrow.onclick = () => {
            open = !open;
            playSoftClick();
            panel.style.width = open ? "200px" : "0px";
            arrow.innerText = open ? ">" : "<";
        };

        wrapper.appendChild(panel);
        wrapper.appendChild(arrow);
        document.body.appendChild(wrapper);

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
                timeout = setTimeout(()=>{ el.style.opacity = "0"; },2500);
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
            if(!effectsEnabled.warnings) return;

            if(effectsEnabled.rain && effectsEnabled.stars){
                redWarning();
            }
            if(effectsEnabled.splash && !effectsEnabled.rain){
                yellowWarning();
            }
        }

        greenWelcome();
        playStartupSound();

        const bind = (id, key, extra)=>{
            const el = panel.querySelector(id);
            el.checked = effectsEnabled[key];

            el.onchange = e=>{
                playSoftClick();
                effectsEnabled[key] = e.target.checked;
                saveSettings();
                if(extra) extra(e);
                updateWarnings();
            };
        };

        bind("#fx-stars","stars",()=>setupAudioAnalysis());
        bind("#fx-rain","rain");
        bind("#fx-splash","splash");
        bind("#fx-comet","comet");
        bind("#fx-simplify","simplify");

        const warnToggle = panel.querySelector("#fx-warnings");
        warnToggle.checked = !effectsEnabled.warnings;

        warnToggle.onchange = e=>{
            playSoftClick();
            effectsEnabled.warnings = !e.target.checked;
            saveSettings();
        };
    }

    function createStars(){
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        Object.assign(canvas.style,{
            position:"fixed",
            top:"0",
            left:"0",
            pointerEvents:"none",
            zIndex:"0"
        });

        document.body.appendChild(canvas);

        function resize(){
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        window.addEventListener("resize", resize);
        resize();

        let stars = [];
        let mode = 0;
        let time = 0;

        let keyImpulse = 0;

        window.addEventListener("keydown", ()=>{
            keyImpulse = 1;
        });

        function spread(){
            stars.forEach(s=>{
                s.tx = Math.random()*canvas.width;
                s.ty = Math.random()*canvas.height;
            });
        }

        function gather(){
            let cx = canvas.width/2;
            let cy = canvas.height/2;
            let radius = 120;
            stars.forEach((s,i)=>{
                let a = (i/stars.length)*Math.PI*2;
                s.tx = cx + Math.cos(a)*radius;
                s.ty = cy + Math.sin(a)*radius;
            });
        }

        window.addEventListener("click", ()=>{
            mode = (mode+1)%2;
            if(mode===0) spread();
            else gather();
        });

        for(let i=0;i<65;i++){
            stars.push({
                x:Math.random()*canvas.width,
                y:Math.random()*canvas.height,
                tx:Math.random()*canvas.width,
                ty:Math.random()*canvas.height,
                vx:(Math.random()-0.5)*0.2,
                vy:(Math.random()-0.5)*0.2,
                size:1.5+Math.random()*2,
                alpha:0.6+Math.random()*0.4
            });
        }

        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            if(!effectsEnabled.stars) return requestAnimationFrame(draw);

            time += 0.01;

            let audioLevel = getAudioLevel();

            keyImpulse *= 0.9;

            for(let s of stars){
                s.vx += (s.tx - s.x)*0.002;
                s.vy += (s.ty - s.y)*0.002;

                let boost = 1 + audioLevel*2 + keyImpulse*2;

                s.vx += Math.sin(time + s.x*0.01)*0.02 * boost;
                s.vy += Math.cos(time + s.y*0.01)*0.02 * boost;

                s.x += s.vx;
                s.y += s.vy;

                s.vx *= 0.96;
                s.vy *= 0.96;

                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
                ctx.shadowBlur = 6 + audioLevel*10 + keyImpulse*10;
                ctx.shadowColor = "white";
                ctx.arc(s.x, s.y, s.size + audioLevel*3 + keyImpulse*2, 0, Math.PI*2);
                ctx.fill();
            }

            requestAnimationFrame(draw);
        }

        draw();
    }

    function createRain(){
        const canvas=document.createElement("canvas");
        const ctx=canvas.getContext("2d");

        Object.assign(canvas.style,{
            position:"fixed",
            top:"0",
            left:"0",
            pointerEvents:"none",
            zIndex:"1"
        });

        document.body.appendChild(canvas);

        function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
        window.addEventListener("resize",resize);
        resize();

        let drops=Array.from({length:140},()=>(({x:Math.random()*canvas.width,y:Math.random()*canvas.height,speed:3+Math.random()*2})));
        let splashes=[];

        function createSplash(x,y){
            if(!effectsEnabled.splash) return;
            let amount = effectsEnabled.simplify ? 6 : 12;
            for(let i=0;i<amount;i++){
                splashes.push({x,y,vx:(Math.random()-0.5)*4,vy:-Math.random()*4,life:30});
            }
        }

        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);

            if(effectsEnabled.rain){
                ctx.strokeStyle = effectsEnabled.simplify
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.25)";

                drops.forEach(d=>{
                    ctx.beginPath();
                    ctx.moveTo(d.x,d.y);
                    ctx.lineTo(d.x,d.y+12);
                    ctx.stroke();
                    d.y+=d.speed;
                    if(d.y>canvas.height){ createSplash(d.x,canvas.height-2); d.y=0; }
                });
            }

            ctx.fillStyle="rgba(255,255,255,0.7)";
            ctx.shadowBlur = effectsEnabled.simplify ? 6 : 15;
            ctx.shadowColor="white";

            for(let i=splashes.length-1;i>=0;i--){
                let p=splashes[i];
                p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life--;
                ctx.fillRect(p.x,p.y,3,3);
                if(p.life<=0) splashes.splice(i,1);
            }

            ctx.shadowBlur=0;
            requestAnimationFrame(draw);
        }

        draw();
    }

    function createComet(){
        const canvas=document.createElement("canvas");
        const ctx=canvas.getContext("2d");

        Object.assign(canvas.style,{
            position:"fixed",
            top:"0",
            left:"0",
            pointerEvents:"none",
            zIndex:"2"
        });

        document.body.appendChild(canvas);

        function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
        window.addEventListener("resize",resize);
        resize();

        let comet=null;

        function spawn(){
            if(!effectsEnabled.comet || comet) return;
            let fromLeft=Math.random()>0.5;
            let duration = 180;
            let distance = canvas.width + 400;
            let speed = distance / duration;
            comet={x:fromLeft?-200:canvas.width+200, y:Math.random()*canvas.height, vx:fromLeft?speed:-speed, life:0, maxLife:duration};
        }

        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            if(comet && effectsEnabled.comet){
                comet.x += comet.vx;
                comet.life++;
                let t = comet.life / comet.maxLife;
                let alpha = 1;
                if(t < 0.15) alpha = t / 0.15;
                else if(t > 0.85) alpha = (1 - t) / 0.15;

                let length = 120 * alpha;
                let grad = ctx.createLinearGradient(comet.x, comet.y, comet.x - comet.vx*length, comet.y);
                grad.addColorStop(0,`rgba(255,255,255,${alpha})`);
                grad.addColorStop(1,"rgba(255,255,255,0)");
                ctx.strokeStyle = grad;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(comet.x, comet.y);
                ctx.lineTo(comet.x - comet.vx*length, comet.y);
                ctx.stroke();

                if(comet.life >= comet.maxLife) comet=null;
            }
            requestAnimationFrame(draw);
        }

        setInterval(spawn, 7500);
        draw();
    }

    createUI();
    createStars();
    createRain();
    createComet();

})();
