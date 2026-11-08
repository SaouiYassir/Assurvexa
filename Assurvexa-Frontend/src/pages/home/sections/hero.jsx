import './Hero.css'

function Hero() {
    return (
        <section id="hero" className="hero">
            <div className="container">

                <div className="hero__content">
                    <div className="hero__left">
                        <p className="eyebrow">
                            Private insurance since 1998
                        </p>

                        <h1 className="hero__title">
                            Protection, <em>quietly</em> perfected.
                        </h1>
                    </div>

                    <div className="hero__right">
                        <p className="section-description">
                            Home, health, life, auto, travel and business —
                            arranged by a single advisor who knows your name,
                            your assets and your plans.
                        </p>

                        <div className="hero__cta">
                            <a href="#quote" className="btn btn-primary">
                                Request a quote
                            </a>

                            <a href="#cover" className="btn btn-secondary">
                                Explore our cover
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default Hero;