// --- Custom Cursor Logic ---

const TAIL_LENGTH = 12;
const tails = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Auto-create tail elements
for (let i = 0; i < TAIL_LENGTH; i++) {
    const el = document.createElement("div");
    el.classList.add("cursor-tail");
    const scale = 1 - (i / TAIL_LENGTH);
    const opacity = 1 - (i / TAIL_LENGTH);
    el.style.opacity = opacity;
    
    document.body.appendChild(el);
    tails.push({ el, x: mouseX, y: mouseY, scale });
}

window.addEventListener("mousemove", function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateTail() {
    let prevX = mouseX;
    let prevY = mouseY;
    
    tails.forEach((pt, index) => {
        // Interpolate position
        pt.x += (prevX - pt.x) * 0.4;
        pt.y += (prevY - pt.y) * 0.4;
        
        pt.el.style.left = `${pt.x}px`;
        pt.el.style.top = `${pt.y}px`;
        pt.el.style.transform = `translate(-50%, -50%) scale(${pt.scale})`;
        
        prevX = pt.x;
        prevY = pt.y;
    });
    
    requestAnimationFrame(animateTail);
}

animateTail();

// No hover effects needed for the default cursor, handled by browser/CSS

// --- Mobile Navigation ---
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
});

// Close Mobile Nav on Link Click
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
    });
});

// --- Scroll Reveal Animations (Intersection Observer) ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("appear");
            // Optional: unobserve if you want it to trigger only once
            // observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with .reveal or .fade-in
document.querySelectorAll(".fade-in, .reveal").forEach(el => {
    observer.observe(el);
});

// --- Anime Helper Interactions ---
const animeCharacter = document.getElementById("anime-character");
const headHitbox = document.getElementById("anime-head-hitbox");
const reactionBubble = document.getElementById("reaction-bubble");

let isPetting = false;

// Head tracking (subtle rotation/movement towards cursor)
window.addEventListener("mousemove", (e) => {
    if (!animeCharacter || isPetting) return;

    const rect = animeCharacter.getBoundingClientRect();
    const charX = rect.left + rect.width / 2;
    const charY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - charX;
    const deltaY = e.clientY - charY;
    
    const rotate = deltaX * 0.015; 
    const moveX = deltaX * 0.01;
    const moveY = deltaY * 0.01;

    animeCharacter.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`;
});

// React to clicks anywhere
window.addEventListener("click", () => {
    if (!reactionBubble || isPetting || !animeCharacter) return;
    
    // Jump animation
    animeCharacter.style.transition = "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    animeCharacter.style.transform = `translateY(-15px)`;
    
    setTimeout(() => {
        if (!isPetting) {
            animeCharacter.style.transform = `translateY(0)`;
        }
        setTimeout(() => {
            if (!isPetting) animeCharacter.style.transition = "transform 0.1s ease-out";
        }, 100);
    }, 150);
});

// Petting interaction
if (headHitbox) {
    headHitbox.addEventListener("mouseenter", () => {
        isPetting = true;
        reactionBubble.innerText = "♡";
        reactionBubble.classList.add("show");
        animeCharacter.style.transition = "transform 0.3s ease";
        animeCharacter.style.transform = "scaleY(0.9) translateY(10px)";
    });

    headHitbox.addEventListener("mouseleave", () => {
        reactionBubble.classList.remove("show");
        animeCharacter.style.transform = "scaleY(1) translateY(0)";
        setTimeout(() => {
            isPetting = false;
            animeCharacter.style.transition = "transform 0.1s ease-out";
        }, 300);
    });
}

// --- Radar Sweep Logic ---
const sweepElement = document.querySelector('.sweep');
const blips = document.querySelectorAll('.radar-blip');

let radarAngle = 0;
let lastTime = 0;

// Calculate angles for blips based on their CSS positions
const blipData = Array.from(blips).map(blip => {
    const left = parseFloat(blip.style.left);
    const top = parseFloat(blip.style.top);
    // Relative to center (50%)
    const dx = left - 50;
    const dy = top - 50;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    
    // Clicking toggles persistent visibility
    blip.addEventListener('click', function(e) {
        this.classList.toggle('fixed');
    });
    
    return { el: blip, angle: angle, lastHit: 0 };
});

function animateRadar(time) {
    if (!lastTime) lastTime = time;
    const dt = time - lastTime;
    lastTime = time;
    
    // Rotate 360 degrees every 4000ms
    radarAngle = (radarAngle + (dt * 360 / 4000)) % 360;
    if (sweepElement) {
        sweepElement.style.transform = `rotate(${radarAngle}deg)`;
    }
    
    // For a top-starting conic gradient, 0 rotation means the line is pointing straight up (-90 degrees from 3 o'clock)
    let sweepLineAngle = radarAngle - 90;
    if (sweepLineAngle < 0) sweepLineAngle += 360;
    
    blipData.forEach(blip => {
        // Calculate degree difference wrapped to 0-360
        let pastDiff = sweepLineAngle - blip.angle;
        if (pastDiff < 0) pastDiff += 360;
        
        // If the sweep line recently crossed the blip (within 25 degrees)
        if (pastDiff >= 0 && pastDiff < 25) {
            blip.el.classList.add('active');
            blip.lastHit = time;
        } else if (blip.lastHit && (time - blip.lastHit > 100)) {
            blip.el.classList.remove('active');
        }
    });

    requestAnimationFrame(animateRadar);
}
requestAnimationFrame(animateRadar);
