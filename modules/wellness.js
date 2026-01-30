import { NotificationSystem } from './ui.js';

export function switchWellnessMode(mode) {
    document.querySelectorAll('.wellness-mode').forEach(el => el.classList.add('hidden'));
    document.getElementById(`mode-${mode}`)?.classList.remove('hidden');
    document.querySelectorAll('.wellness-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(`'${mode}'`)) btn.classList.add('active');
    });
    if (mode === 'clouds') initCloudGame();
}

export function initCloudGame() {
    const area = document.querySelector('.cloud-game-area') || document.getElementById('clouds-overlay');
    if (!area) return;
    area.innerHTML = '<div class="sun-behind">☀️</div>';
    const cloudEmojis = ['☁️', '🌥️', '⛈️', '🌫️'];
    for (let i = 0; i < 8; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud-item';
        cloud.innerText = cloudEmojis[Math.floor(Math.random() * cloudEmojis.length)];
        cloud.style.left = Math.random() * 80 + 10 + '%';
        cloud.style.top = Math.random() * 60 + 10 + '%';
        cloud.onclick = function () {
            this.style.opacity = '0';
            this.style.transform = 'scale(2) translateY(-50px)';
            setTimeout(() => {
                this.remove();
                if (area.querySelectorAll('.cloud-item').length === 0) {
                    NotificationSystem.show("Ou netwaye syèl la! ✨", "success");
                    initCloudGame();
                }
            }, 500);
        };
        area.appendChild(cloud);
    }
}

let gratitudeCount = 0;
export function addGratitudeNote() {
    const input = document.getElementById('gratitude-text');
    const text = input.value.trim();
    if (!text) return;
    const jarBody = document.getElementById('gratitude-jar-body');
    const fill = document.getElementById('jar-fill-level');
    const note = document.createElement('div');
    note.className = 'gratitude-note';
    note.innerText = text;
    note.style.left = Math.random() * 70 + '%';
    note.style.bottom = (gratitudeCount * 15) + 'px';
    jarBody.appendChild(note);
    gratitudeCount++;
    if (fill) fill.style.height = Math.min(gratitudeCount * 10, 100) + '%';
    input.value = '';
    NotificationSystem.show("Kore! Rekonesans se fòs. 😊", "success");
}

let vibeScore = 0;
let vibeInterval;

export function initVibeGame() {
    const area = document.getElementById('vibe-game-area');
    const startBtn = document.getElementById('vibe-start-btn');
    if (!area) return;

    vibeScore = 0;
    document.getElementById('vibe-score').innerText = `Sko: ${vibeScore}`;
    startBtn.style.display = 'none';

    if (vibeInterval) clearInterval(vibeInterval);
    vibeInterval = setInterval(spawnVibe, 1000);

    setTimeout(() => {
        clearInterval(vibeInterval);
        startBtn.style.display = 'inline-block';
        startBtn.innerText = 'Re-kòmanse';
        NotificationSystem.show(`Jwèt fini! Sko ou se: ${vibeScore}. Ou se yon chanpyon pozitif! ✨`, "success", 8000);
    }, 30000);
}

function spawnVibe() {
    const area = document.getElementById('vibe-game-area');
    if (!area) return;

    const item = document.createElement('div');
    item.className = 'vibe-item';
    const vibes = ['✨', '❤️', '🦋', '🌟', '🍀', '🌈', '☀️', '💖'];
    item.innerText = vibes[Math.floor(Math.random() * vibes.length)];

    const x = Math.random() * (area.clientWidth - 40);
    item.style.left = `${x}px`;
    item.style.animation = `fall 3s linear forwards`;

    item.onclick = () => {
        vibeScore += 10;
        document.getElementById('vibe-score').innerText = `Sko: ${vibeScore}`;
        item.remove();
    };

    area.appendChild(item);
    setTimeout(() => { if (item.parentNode) item.remove(); }, 3000);
}

export function initBreathingExercise() {
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breath-instruction');
    const btn = document.getElementById('start-breath-btn');
    if (!btn) return;

    btn.disabled = true;
    let count = 0;
    const phases = [
        { text: "Respire (4s)", class: "inhale", time: 4000 },
        { text: "Kenbe (7s)", class: "hold", time: 7000 },
        { text: "Soufle (8s)", class: "exhale", time: 8000 }
    ];

    function runPhase() {
        const phase = phases[count % 3];
        text.innerText = phase.text;
        circle.className = 'breathing-circle ' + phase.class;

        setTimeout(() => {
            count++;
            if (count < 9) {
                runPhase();
            } else {
                text.innerText = "Fini! Ou santi w pi byen?";
                circle.className = 'breathing-circle';
                btn.disabled = false;
            }
        }, phase.time);
    }
    runPhase();
}
