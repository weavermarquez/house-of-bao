export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About</h3>
          <p className="footer-description">
            A boundary logic puzzle game based on Laws of Form, teaching mathematics through elegant simplicity.
          </p>
          <div className="footer-links">
            <a href="https://github.com/weavermarquez/house-of-bao" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="mailto:valerie.kim.dev@gmail.com">
              Contact
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Learn More</h3>
          <div className="footer-links">
            <a href="https://lof50.com" target="_blank" rel="noopener noreferrer">
              Laws of Form
            </a>
            <a href="https://iconicmath.com" target="_blank" rel="noopener noreferrer">
              Iconic Math
            </a>
            <a href="https://x.com/ForecastFire" target="_blank" rel="noopener noreferrer">
              Twitter/X
            </a>
          </div>
        </div>
      </div>

      <div className="footer-credits">
        <p>
          Based on the work of George Spencer-Brown, William Bricken, and Jeffrey James.
        </p>
        <p className="footer-mission">
          Eradicating mathphobia through boundary logic. 💫
        </p>
      </div>
    </footer>
  )
}
