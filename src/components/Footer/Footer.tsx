import React from 'react';
import { PortfolioFooterContent } from '../../types/portfolio';
import './Footer.css';

// ▶ Dynamically load all images from src/asset/homePage/
// Place your footer showcase images (jpg, png, webp, gif) in that directory.
const loadHomePageImages = (): string[] => {
  try {
    const context = (require as any).context(
      '../../asset/homePage',
      false,
      /\.(png|jpe?g|gif|webp)$/i,
    );
    return context.keys().map((key: string) => context(key) as string);
  } catch {
    return [];
  }
};

const images = loadHomePageImages();

// Duplicate images for a seamless loop (only if images exist)
const row1Images = images.length > 0 ? [...images, ...images] : [];
const halfLen = Math.floor(images.length / 2);
const row2Images = images.length > 0
  ? [...images.slice(halfLen), ...images.slice(0, halfLen), ...images.slice(halfLen), ...images.slice(0, halfLen)]
  : [];

type FooterProps = {
  content: PortfolioFooterContent;
};

const Footer: React.FC<FooterProps> = ({ content }) => {

  return (
    <footer className="animated-footer">
      <div className="image-scroller-container">
        <div className="scrolling-row-wrapper">
          <div className="scrolling-row left">
            {row1Images.map((src, index) => (
              <img key={`row1-${index}`} src={src} alt="" className="scrolling-image" />
            ))}
          </div>
        </div>
        <div className="scrolling-row-wrapper">
          <div className="scrolling-row right">
            {row2Images.map((src, index) => (
              <img key={`row2-${index}`} src={src} alt="" className="scrolling-image" />
            ))}
          </div>
        </div>
      </div>
      <div className="footer-color-overlay"></div>
      <div className="footer-text-content">
        <div className="footer-content">
          <h2>{content.title}</h2>
          <p>{content.message}</p>
          <a href={`mailto:${content.email}`} className="footer-email-link">{content.email}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;