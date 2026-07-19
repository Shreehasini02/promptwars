export default function HeroSection({ currentSlide, setCurrentSlide, slideCount, onOpenDashboard }) {
  return (
    <main className="hero">
      <div className="tagline">
        <span className="dot"></span> TripPilot AI - Your Journey, Guided by AI
      </div>
      <h1 className="hero-title">Create your itinerary</h1>
      <p className="hero-subtitle">
        Experience a smarter travel search that finds the perfect lodging, itinerary and
        flights — with your preferences as the highest priority.
      </p>

      {/* Slide Indicators */}
      <div className="slide-indicators">
        {Array.from({ length: slideCount }).map((_, i) => (
          <span
            key={i}
            className={`indicator ${i === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(i)}
          />
        ))}
      </div>
    </main>
  )
}
