import './quote.css'
import { ArrowUpRight, Mail, Phone, ShieldCheck } from 'lucide-react'

function Quote() {
    return (
        <section id='quote' className="quote-section">
            <div className="quote-container">

                <div className="quote-content">
                    <span className="quote-eyebrow">
                        YOUR NEXT CHAPTER
                    </span>

                    <h1>
                        REQUEST A <span>QUOTE</span>
                    </h1>

                    <h3>Begin with a conversation.</h3>

                    <p>
                        Tell us what you wish to protect.
                        An advisor will reply within one working day,
                        with no obligation.
                    </p>

                    <div className="quote-actions">
                        <a href="mailto:contact@assurvexa.com"
                           className="quote-primary-btn">
                            Get in touch
                            <ArrowUpRight size={18} />
                        </a>

                        <a href="https://wa.me/212600000000"
                           target="_blank"
                           rel="noreferrer"
                           className="quote-secondary-btn">
                            Contact via WhatsApp
                        </a>
                    </div>

                    <div className="quote-contact">
                        <div>
                            <Mail size={17} />
                            <span>contact@assurvexa.com</span>
                        </div>

                        <div>
                            <Phone size={17} />
                            <span>+212 600 000 000</span>
                        </div>
                    </div>
                </div>

                <div className="quote-decoration">
                    <div className="quote-icon">
                        <ShieldCheck size={48} strokeWidth={1} />
                    </div>

                    <span className="quote-decoration-title">
                        Protection, crafted with care.
                    </span>

                    <p>
                        Every great protection plan begins
                        with understanding what matters most.
                    </p>

                    <div className="quote-decoration-line" />

                    <span className="quote-decoration-label">
                        ASSURVEXA PRIVATE CLIENTS
                    </span>
                </div>

            </div>
        </section>
    )
}

export default Quote
