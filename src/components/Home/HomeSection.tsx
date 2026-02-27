import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { PortfolioHomeContent, BlobConfig } from '../../types/portfolio';
import HomeBackgroundGrid from './HomeBackgroundGrid';

type HomeSectionProps = {
  onNavigateCv: () => void;
  onNavigatePortfolio: () => void;
  content: PortfolioHomeContent;
};

/** Render a single blob circle from config */
const BlobCircle: React.FC<{ blob: BlobConfig; index: number }> = ({ blob, index }) => {
  const isLarge = blob.size === 'large';
  const width = blob.width || (isLarge ? '40%' : '12%');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: blob.x,
    top: blob.y,
    width,
    aspectRatio: '1',
    animationDuration: blob.animDuration ? `${blob.animDuration}s` : undefined,
    animationDelay: blob.animDelay ? `${blob.animDelay}s` : undefined,
  };

  // Build label with line breaks
  const labelParts = blob.label.split('\n');

  if (isLarge) {
    // Large blob: has gradient ::before pseudo-element via CSS class
    return (
      <div
        className={`blob-circle blob-large`}
        style={{
          ...style,
          '--blob-color': blob.color || '#fd9225',
        } as React.CSSProperties}
      >
        <span>
          {labelParts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < labelParts.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      </div>
    );
  }

  // Small blob
  return (
    <div className="blob-circle blob-small" style={style}>
      <span>
        {labelParts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < labelParts.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    </div>
  );
};

const HomeSection: React.FC<HomeSectionProps> = ({
  onNavigateCv,
  onNavigatePortfolio,
  content,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`home-section ${isLoaded ? 'is-loaded' : ''}`}>
      <HomeBackgroundGrid />
      <div className="home-text-col">
        {content.badge && <h3 className="home-subtitle">{content.badge}</h3>}
        <h1 className="home-title-large">{content.title}</h1>

        <div className="home-actions">
          <button type="button" className="home-action-btn" onClick={onNavigateCv}>
            CV
          </button>
          <button
            type="button"
            className="home-action-btn is-accent"
            onClick={onNavigatePortfolio}
          >
            作品集
          </button>
        </div>

        <div className="home-intro">
          <ReactMarkdown>{content.intro.join('\n\n')}</ReactMarkdown>
        </div>
      </div>

      <div className="home-graphic-col">
        <div className="blob-container">
          {content.blobs.map((blob, index) => (
            <BlobCircle key={blob.id} blob={blob} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
