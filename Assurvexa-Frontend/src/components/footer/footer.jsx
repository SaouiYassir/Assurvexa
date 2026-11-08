import { Link } from 'react-router-dom';
import './footer.css'

function Footer() {

    const year = new Date().getFullYear();
    const scroll = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <footer>
            <div className="footer-grid">
                <div className='footer-left'>
                    <Link to="/" onClick={scroll}>
                        Assruvexa
                    </Link>
                    <p className="footer-tagline">
                        Considered insurance for people and businesses who value discretion.
                    </p>
                </div>

                <div className="footer-center">
                    <h3 className="footer-heading">Explore</h3>

                    <ul className="footer-list">
                        <li><Link to="/">Home</Link></li>
                        <li><a href="#cover">Insurance Plans</a></li>
                        <li><a href="#philosophy">Our Philosophy</a></li>
                        <li><a href="#quote">Get in Touch</a></li>
                    </ul>
                </div>

                <div className="footer-right">
                    <h3 className="footer-heading">Contact</h3>
                    
                    <ul className="footer-list">
                        <li>
                            <a href="mailto:hello@assurvexa.com" className="footer-link">hello@assurvexa.com</a>
                        </li>
                        <li>
                            <a href="tel:+212500000000" className="footer-link">+212 5 00 00 00 00</a>
                        </li>
                        <li>
                            <a className="footer-link" target="_blank" href="https://www.google.com/maps/place/Agadir+80000/data=!4m2!3m1!1s0xdb3b6e9daad1cc9:0xbcf8d0b78bf48474?sa=X&ved=1t:242&ictx=111">Morocco, Agadir</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className='footer-bottom'>
                <p>© {year} Assurvexa. All rights reserved.</p>
                <p>Realised by Saoui Yassir.</p>
            </div>
        </footer>
    )
}

export default Footer;