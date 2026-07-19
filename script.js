document.addEventListener('DOMContentLoaded', () => {
    // Slideshow Logic
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide + 1) % slides.length;
        
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }

    // Change slide every 4 seconds
    setInterval(nextSlide, 4000);

    // Indicator Click Logic
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            slides[currentSlide].classList.remove('active');
            indicators[currentSlide].classList.remove('active');
            
            currentSlide = index;
            
            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
        });
    });

    // Modal Logic
    const logoBtn = document.getElementById('logo-btn');
    const modal = document.getElementById('dashboard-modal');
    const closeBtn = document.getElementById('close-modal');

    logoBtn.addEventListener('click', () => {
        modal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});
