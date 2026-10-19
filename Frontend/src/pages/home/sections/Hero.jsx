import './Hero.css'

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="container">
        <p className="eyebrow">Private insurance since 1998</p>

        <h1 className="hero__title">
          Protection, <em>quietly</em> perfected.
        </h1>

        <p className="section-description">
          Home, health, life, auto, travel and business — arranged by a single
          advisor who knows your name, your assets and your plans.
        </p>

        <div className="hero__cta flex gap-4">
          <a href="#quote" className="btn btn-primary btn-lg">Request a quote</a>
          <a href="#cover" className="btn btn-secondary btn-lg">Explore our cover</a>
        </div>
      </div>
    </section>
  )
}

export default Hero