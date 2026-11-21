import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, PhoneCall, Globe2, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="brand-logo">
              <div className="brand-icon-wrapper">
                <HeartHandshake size={22} />
              </div>
              <div className="brand-name">
                Bhojan<span>Setu</span>
              </div>
            </div>
            <p className="footer-tagline">
              A real-time surplus food redistribution bridge connecting hotels,
              caterers, and residential kitchens with verified local NGOs to eliminate
              hunger and landfill methane emissions.
            </p>
            <div className="footer-sdg-pills">
              <span className="sdg-pill sdg-2">
                <Globe2 size={13} />
                UN SDG 2: Zero Hunger
              </span>
              <span className="sdg-pill sdg-12">
                <ShieldCheck size={13} />
                UN SDG 12: Responsible Consumption
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home Overview</Link>
              </li>
              <li>
                <Link to="/feed">Live Food Feed</Link>
              </li>
              <li>
                <Link to="/register">Register as Donor</Link>
              </li>
              <li>
                <Link to="/register">Register as NGO</Link>
              </li>
              <li>
                <Link to="/login">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="footer-title">Safety & Impact</h4>
            <ul className="footer-links">
              <li>
                <a href="#how-it-works">How It Works</a>
              </li>
              <li>
                <a href="#sdg-alignment">UN SDG Targets</a>
              </li>
              <li>
                <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  FSSAI Food Safety Norms
                </span>
              </li>
              <li>
                <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  Hygienic Transit Protocol
                </span>
              </li>
            </ul>
          </div>

          {/* Emergency Hotline */}
          <div>
            <div className="footer-helpline-box">
              <div className="helpline-title">
                <PhoneCall size={16} />
                Emergency Surplus Hotline
              </div>
              <div className="helpline-number">+91 1800-246-526</div>
              <p className="helpline-text">
                Large banquet or event surplus exceeding 200 servings? Call our 24/7
                rapid volunteer response team.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} BhojanSetu Platform. Built with{' '}
            <Heart size={13} style={{ color: 'var(--accent)', display: 'inline', verticalAlign: 'baseline' }} />{' '}
            for Zero Hunger & Climate Action.
          </div>
          <div className="footer-bottom-links">
            <span>Production MERN Stack</span>
            <span>•</span>
            <span>No Food Wasted</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
