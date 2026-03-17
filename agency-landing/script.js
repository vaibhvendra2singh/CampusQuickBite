/**
 * CampusBite Elite | Premium UI Logic
 * Handles animations, typewriter effects, and the 3-step modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initTypewriter();
    initChips();
});

/* --- Animations & Intersection Observer --- */
function initAnimations() {
    // Observer for elements appearing on scroll or load
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    // Targeting the floating chips for slide-in effects
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => observer.observe(chip));
}

function initChips() {
    // Manually trigger chips if they are within view on load
    setTimeout(() => {
        const chips = document.querySelectorAll('.chip');
        chips.forEach((chip, index) => {
            setTimeout(() => {
                chip.classList.add('active');
            }, index * 200); // Staggered delay
        });
    }, 500);
}

/* --- Typewriter Effect for Search Bar --- */
function initTypewriter() {
    const input = document.getElementById('ai-search');
    const placeholders = [
        "I'm craving a Spicy Paneer Roll...",
        "What's open at North Block?",
        "Show me the trending juices...",
        "I need coffee immediately.",
        "Best double cheese pizza near me?"
    ];

    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    function type() {
        const fullText = placeholders[currentIdx];
        
        if (isDeleting) {
            input.placeholder = fullText.substring(0, charIdx--);
            typeSpeed = 40;
        } else {
            input.placeholder = fullText.substring(0, charIdx++);
            typeSpeed = 100;
        }

        if (!isDeleting && charIdx === fullText.length + 1) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            currentIdx = (currentIdx + 1) % placeholders.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

/* --- Booking Modal Logic --- */
const modal = document.getElementById('booking-modal');
let currentStep = 1;

function openBooking() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scroll
    resetModal();
}

function closeBooking() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function nextStep(step) {
    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`dot-${currentStep}`).classList.remove('active');

    // Show next step
    currentStep = step;
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.getElementById(`dot-${currentStep}`).classList.add('active');
}

function resetModal() {
    // Reset to first step
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`step-${i}`).classList.remove('active');
        document.getElementById(`dot-${i}`).classList.remove('active');
    }
    currentStep = 1;
    document.getElementById(`step-1`).classList.add('active');
    document.getElementById(`dot-1`).classList.add('active');
}

// Close modal on click outside content
window.onclick = function(event) {
    if (event.target === modal) {
        closeBooking();
    }
};
