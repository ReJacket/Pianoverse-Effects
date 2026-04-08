// ==UserScript==
// @name         Pianoverse Atmosphere FX v13
// @namespace    http://tampermonkey.net/
// @version      13.0
// @match        *://pianoverse.net/*
// @grant        none
// @creator      CharaChocolat =) greetings!
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIG ---
    let effectsEnabled = {
        rain: false,
        splash: false,
        stars: false,
        comet: false
    };

    // --- SOMS ---
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

    // --- AUDIO ANALYZER PARA ESTRELAS ---
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

        return sum / dataArray.length / 255; // normalizado entre 0 e 1
    }

    // --- UI ---
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
            setupAudioAnalysis(); // ativa o analisador quando stars ligadas
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

    // --- ESTRELAS ---
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

            for(let s of stars){
                s.vx += (s.tx - s.x)*0.002;
                s.vy += (s.ty - s.y)*0.002;

                s.vx += Math.sin(time + s.x*0.01)*0.02 * (1 + audioLevel*2);
                s.vy += Math.cos(time + s.y*0.01)*0.02 * (1 + audioLevel*2);

                s.x += s.vx;
                s.y += s.vy;

                s.vx *= 0.96;
                s.vy *= 0.96;

                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
                ctx.shadowBlur = 6 + audioLevel*10;
                ctx.shadowColor = "white";
                ctx.arc(s.x, s.y, s.size + audioLevel*3, 0, Math.PI*2);
                ctx.fill();
            }

            requestAnimationFrame(draw);
        }

        draw();
    }

    // --- CHUVA & SPLASH ---
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
            for(let i=0;i<12;i++){
                splashes.push({x,y,vx:(Math.random()-0.5)*4,vy:-Math.random()*4,life:30});
            }
        }

        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);

            if(effectsEnabled.rain){
                ctx.strokeStyle="rgba(255,255,255,0.25)";
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
            ctx.shadowBlur=15;
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

    // --- COMETA ---
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

    // --- INICIALIZAÇÃO ---
    createUI();
    createStars();
    createRain();
    createComet();

})();
