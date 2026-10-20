import { Link } from "react-router-dom";
import "./Footer.css";

const COLUMNS = [
  {
    title: "Cover",
    links: [
      { label: "Home", to: "/" },
      { label: "Health", to: "/health" },
      { label: "Life", to: "/life" },
      { label: "Auto", to: "/auto" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Advisors", to: "/advisors" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Assurvexa home">
              Assurvexa
            </Link>
            <p className="footer-tagline">
              Considered insurance for people and businesses who value
              discretion.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} className="footer-col" aria-label={col.title}>
              <h3 className="footer-heading">{col.title}</h3>
              <ul className="footer-list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="footer-col">
            <h3 className="footer-heading">Contact</h3>
            <ul className="footer-list">
              <li>
                <a href="mailto:hello@assurvexa.com" className="footer-link">
                  hello@assurvexa.com
                </a>
              </li>
              <li>
                <a href="tel:+212500000000" className="footer-link">
                  +212 5 00 00 00 00
                </a>
              </li>
              <li>
                <a className="footer-link" target="_blank" href="https://www.google.com/maps/place/Agadir+80000/data=!4m2!3m1!1s0xdb3b6e9daad1cc9:0xbcf8d0b78bf48474?sa=X&ved=1t:242&ictx=111">Morocco, Agadir</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} Assurvexa. All rights reserved.</p>
          <p>Realised by Saoui Yassir.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;