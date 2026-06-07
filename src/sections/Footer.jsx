import { ExternalLink, Heart, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footerMain">
        <div className="footerBrand">
          <a className="brand footerBrandLogo" href="#home" aria-label="PropertyDNA home">
            <img src="/logo.png" alt="PropertyDNA Logo" className="brandLogo footerLogo" />
            <span className="brandName footerBrandName">Property<b>DNA</b></span>
          </a>
          <p>Professional property insight and valuation interface built for real estate teams, buyers, and analysts.</p>
        </div>

        <div className="footerCol">
          <h3>Navigation</h3>
          <a href="#home">Home</a>
          <a href="#works">How It Works</a>
          <a href="#predictor">Predictor</a>
          <a href="#about">About</a>
        </div>

        <div className="footerCol">
          <h3>Contact</h3>
          <p><Mail size={16} /> hello@propertydna.ai</p>
          <p><Phone size={16} /> +91 8910568954</p>
          <p><MapPin size={16} /> Kolkata, India</p>
        </div>

        <div className="footerCol">
          <h3>Built For</h3>
          <p>Real estate analysis</p>
          <p>Maintenance planning</p>
          <p>Investment screening</p>
        </div>
      </div>

      <div className="footerBottom">
        <p>(c) 2026 PropertyDNA. All rights reserved.</p>
        <p>Built with <Heart size={16} /> and Machine Learning</p>
        <a href="#home" aria-label="Project link"><ExternalLink size={17} /> Project</a>
      </div>
    </footer>
  );
}
