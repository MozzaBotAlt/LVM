console.info("Copyright (C) 2025  Ali Mozzabot I, This program comes with ABSOLUTELY NO WARRANTY. This is free software, and you are welcome to redistribute it under certain conditions. ")

// Add fading effects when switching tabs
document.addEventListener("DOMContentLoaded", function () {
    // Animate cards and buttons on load
    const cards = document.querySelectorAll('.card');
    const buttons = document.querySelectorAll('button, .btn');
    cards.forEach((card, i) => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(40px) scale(0.96)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.7s cubic-bezier(.68,-0.55,.27,1.55), transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)';
            card.style.opacity = 1;
            card.style.transform = 'translateY(0) scale(1)';
        }, 200 + i * 120);
    });
    buttons.forEach((btn, i) => {
        btn.style.opacity = 0;
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            btn.style.transition = 'opacity 0.5s, transform 0.5s cubic-bezier(.68,-0.55,.27,1.55)';
            btn.style.opacity = 1;
            btn.style.transform = 'scale(1)';
        }, 400 + i * 80);
        // Ripple/glow effect on click
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = e.offsetX + 'px';
            ripple.style.top = e.offsetY + 'px';
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
    // Animated icon hover
    const icons = document.querySelectorAll('i.fa-solid');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transition = 'transform 0.4s cubic-bezier(.68,-0.55,.27,1.55), color 0.3s';
            icon.style.transform = 'scale(1.2) rotate(-10deg)';
            icon.style.color = '#00fff7';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1) rotate(0deg)';
            icon.style.color = '';
        });
    });

    const scrollTicker = document.querySelector('.scroll-ticker');
    if (scrollTicker) {
        let scrollSpeed = 0.36;
        function animateScroll() {
            scrollTicker.scrollLeft += scrollSpeed;
            if (scrollTicker.scrollLeft >= scrollTicker.scrollWidth - scrollTicker.clientWidth) {
                scrollTicker.scrollLeft = 0;
            }
            requestAnimationFrame(animateScroll);
        }
        animateScroll();

        scrollTicker.addEventListener('mouseenter', () => {
            scrollSpeed = 0;
        });
        scrollTicker.addEventListener('mouseleave', () => {
            scrollSpeed = 0.36;
        });
    }
    // Ripple effect CSS (inject once)
    if (!document.getElementById('ripple-style')) {
        const rippleStyle = document.createElement('style');
        rippleStyle.id = 'ripple-style';
        rippleStyle.innerHTML = `
        .ripple-effect {
            position: absolute;
            width: 40px;
            height: 40px;
            background: rgba(0,255,247,0.4);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%) scale(0.5);
            animation: ripple-anim 0.6s linear;
            z-index: 2;
        }
        @keyframes ripple-anim {
            0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.5); }
            80% { opacity: 0.4; transform: translate(-50%, -50%) scale(2.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2.8); }
        }
        `;
        document.head.appendChild(rippleStyle);
    }
    // Assume tabs are <a> elements inside nav, and tab contents have class "tab-content"
    const tabLinks = document.querySelectorAll("nav ul li a");
    const tabContents = document.querySelectorAll(".tab-content");

    function showTab(targetId) {
        tabContents.forEach(content => {
            if (content.id === targetId) {
                content.style.opacity = 0;
                content.style.display = "block";
                setTimeout(() => {
                    content.style.transition = "opacity 0.5s";
                    content.style.opacity = 1;
                }, 10);
            } else {
                content.style.transition = "opacity 0.5s";
                content.style.opacity = 0;
                setTimeout(() => {
                    content.style.display = "none";
                }, 500);
            }
        });
    }

    tabLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href").replace("#", "");
            if (document.getElementById(targetId)) {
                e.preventDefault();
                showTab(targetId);
            }
        });
    });

    // Optional: Show the first tab by default
    if (tabContents.length > 0) {
        tabContents.forEach((c, i) => {
            c.style.opacity = i === 0 ? 1 : 0;
            c.style.display = i === 0 ? "block" : "none";
            c.style.transition = "opacity 0.5s";
        });
    }
});