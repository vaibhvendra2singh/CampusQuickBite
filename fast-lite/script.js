/**
 * CampusBite | Ultra-Fast Core JS
 * Focused on performance, event delegation, and minimal DOM impact.
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeroSpeed();
    initTypewriter();
    initLazyLoad();
    initModal();
    initScrollReveal();
});

/* 1. Hero Performance Optimization */
function initHeroSpeed() {
    const video = document.getElementById('heroVideo');
    const fallback = document.getElementById('heroFallback');

    // Only load video after initial interaction or a short delay to prioritize FCP
    const loadVideo = () => {
        if (video.readyState === 0) {
            video.preload = 'auto';
            video.load();
            video.play().then(() => {
                fallback.style.opacity = '0';
                setTimeout(() => fallback.classList.add('hidden'), 500);
            }).catch(() => {
                // Autoplay failed, keep fallback
                console.log('Autoplay blocked');
            });
        }
    };

    // Trigger video load after early rendering
    requestIdleCallback ? requestIdleCallback(loadVideo) : setTimeout(loadVideo, 1000);
}

/* 2. AI Search Typewriter Effect (Lightweight) */
function initTypewriter() {
    const input = document.getElementById('aiSearch');
    const phrases = [
        "I'm craving a Spicy Paneer Roll...",
        "What's open at North Block?",
        "Show me the trending juices...",
        "I need coffee immediately.",
        "Best double cheese pizza near me?"
    ];

    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let speed = 100;

    function type() {
        const fullText = phrases[currentIdx];
        
        if (isDeleting) {
            input.placeholder = fullText.substring(0, charIdx--);
            speed = 50;
        } else {
            input.placeholder = fullText.substring(0, charIdx++);
            speed = 100;
        }

        if (!isDeleting && charIdx === fullText.length + 1) {
            isDeleting = true;
            speed = 2000; // Pause at end
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            currentIdx = (currentIdx + 1) % phrases.length;
            speed = 500;
        }

        setTimeout(type, speed);
    }
    
    type();
}

/* 3. Lazy Load Content Simulation */
function initLazyLoad() {
    const grids = {
        vendorGrid: [
            { name: "North Block Bistro", rating: "4.9★", img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=300" },
            { name: "Cafe Coffee Day", rating: "4.5★", img: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300" },
            { name: "Juice Center", rating: "4.7★", img: "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=300" }
        ],
        dishGrid: [
            { name: "Peri Peri Fries", price: "₹120", img: "https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=300" },
            { name: "Veggie Burger", price: "₹160", img: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=300" },
            { name: "Mango Shake", price: "₹80", img: "https://images.pexels.com/photos/103566/pexels-photo-103566.jpeg?auto=compress&cs=tinysrgb&w=300" }
        ]
    };

    setTimeout(() => {
        for (const [id, items] of Object.entries(grids)) {
            const container = document.getElementById(id);
            container.innerHTML = ''; // Clear skeletons
            
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card scroll-reveal';
                card.innerHTML = `
                    <div style="width:100%; height:180px; background-image:url('${item.img}'); background-size:cover; border-radius:12px; margin-bottom:1.5rem;"></div>
                    <h3 style="margin-bottom:0.5rem;">${item.name}</h3>
                    <p style="color:var(--text-muted);">${item.rating || item.price}</p>
                `;
                container.appendChild(card);
            });
        }
        initScrollReveal(); // Re-init for new elements
    }, 800);
}

/* 4. Smart Modal Logic */
function initModal() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.getElementById('closeModal');
    const backdrop = document.getElementById('modalBackdrop');
    const openBtn = document.querySelector('.cta-btn'); // Mock open

    const toggleModal = (show) => {
        if (show) {
            modal.classList.remove('hidden');
            loadModalContent(1);
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    };

    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleModal(true);
    });

    closeBtn.addEventListener('click', () => toggleModal(false));
    backdrop.addEventListener('click', () => toggleModal(false));

    function loadModalContent(step) {
        const body = document.getElementById('modalBody');
        const layouts = {
            1: `
                <h2 style="font-family:var(--font-heading); italic; font-size:2.5rem; margin-bottom:1.5rem;">Select Outlet.</h2>
                <div style="display:grid; gap:0.5rem;">
                    <button class="cta-btn" style="background:var(--glass-bg); border:1px solid var(--glass-border); text-align:left;" onclick="window.nextModalStep(2)">North Block Bistro</button>
                    <button class="cta-btn" style="background:var(--glass-bg); border:1px solid var(--glass-border); text-align:left;" onclick="window.nextModalStep(2)">Juice Center</button>
                </div>
            `,
            2: `
                <h2 style="font-family:var(--font-heading); italic; font-size:2.5rem; margin-bottom:1.5rem;">Choose Meal.</h2>
                <div style="display:grid; gap:0.5rem;" onclick="window.nextModalStep(3)">
                    <button class="cta-btn" style="background:var(--glass-bg); border:1px solid var(--glass-border); text-align:left;">Peri Peri Fries - ₹120</button>
                    <button class="cta-btn" style="background:var(--glass-bg); border:1px solid var(--glass-border); text-align:left;">Veggie Burger - ₹160</button>
                </div>
            `,
            3: `
                <h2 style="font-family:var(--font-heading); italic; font-size:2.5rem; margin-bottom:1rem;">Finalize Order.</h2>
                <p style="color:var(--text-muted); margin-bottom:2rem;">Total: ₹160. Your slot will be reserved for 12:45 PM.</p>
                <button class="cta-btn" style="width:100%; border:none; cursor:pointer;" onclick="window.finalizeOrder()">Confirm Payment</button>
            `
        };
        body.innerHTML = layouts[step];
    }

    window.nextModalStep = loadModalContent;
    window.finalizeOrder = () => {
        toggleModal(false);
        const chip = document.getElementById('trackingChip');
        chip.classList.remove('hidden');
    };
}

/* 5. Scroll Reveal with IntersectionObserver */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}
