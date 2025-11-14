import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Landing.css';

export function Landing() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div className={`landing-container ${loaded ? 'loaded' : ''}`}>
      <div className="hero-section">
        <img
          src="/hero.png"
          alt="House of Bao - surreal dumpling houses in a landscape"
          className="hero-image"
        />

        {/* Floating geometric accents */}
        <div className="geometric-accent accent-square"></div>
        <div className="geometric-accent accent-circle"></div>
        <div className="geometric-accent accent-triangle"></div>

        {/* Main content */}
        <div className="hero-content">
          <div className="title-lockup">
            <div className="title-line">
              <span className="title-word house">HOUSE</span>
              <span className="title-word of">of</span>
            </div>
            <div className="title-line">
              <span className="title-word bao">BAO</span>
            </div>
          </div>

          <div className="subtitle-container">
            <div className="subtitle-line"></div>
            <p className="subtitle">where boundaries dissolve</p>
            <div className="subtitle-line"></div>
          </div>

          <div className="tagline">
            <span className="tagline-text">Numbers that look like what they mean</span>
          </div>

          <Link to="/game" className="enter-button">
            <span className="button-bg"></span>
            <span className="button-text">Enter</span>
            <svg className="button-arrow" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </Link>
        </div>

        {/* Bottom accent */}
        <div className="bottom-accent">
          <span className="accent-text">Bauhaus • Bao • Boundaries</span>
        </div>
      </div>
    </div>
  );
}
