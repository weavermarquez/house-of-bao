import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Landing.css';

export function Landing() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50);
  }, []);

  return (
    <div className={`landing-container ${loaded ? 'loaded' : ''}`}>
      {/* Left Panel - Typography */}
      <div className="left-panel">
        <div className="title-block">
          <div className="title-number">01</div>
          <h1 className="title-main">
            <span className="title-line">House</span>
            <span className="title-line">of</span>
            <span className="title-line">Bao</span>
          </h1>
        </div>

        <div className="meta-block">
          <div className="meta-row">
            <span className="meta-label">Type</span>
            <span className="meta-value">Mathematical Puzzle</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Theme</span>
            <span className="meta-value">Boundary Logic</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Philosophy</span>
            <span className="meta-value">Iconic Arithmetic</span>
          </div>
        </div>

        <div className="description-block">
          <p className="description-text">
            Where boundaries dissolve and numbers look like what they mean.
            A fusion of Bauhaus precision and organic form.
          </p>
        </div>

        <Link to="/game" className="cta-button">
          <span className="cta-label">Start</span>
          <span className="cta-arrow">→</span>
        </Link>
      </div>

      {/* Right Panel - Hero Image */}
      <div className="right-panel">
        <div className="image-container">
          <img
            src="/hero.png"
            alt="House of Bao"
            className="hero-image"
          />
          <div className="image-caption">
            <span className="caption-text">Bauhaus × Bao × Boundaries</span>
          </div>
        </div>
      </div>
    </div>
  );
}
