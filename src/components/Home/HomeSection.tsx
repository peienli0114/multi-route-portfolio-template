import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { PortfolioHomeContent } from '../../types/portfolio';
import HomeBackgroundGrid from './HomeBackgroundGrid';

type HomeSectionProps = {
  onNavigateCv: () => void;
  onNavigatePortfolio: () => void;
  content: PortfolioHomeContent;
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
          <div className="blob-circle blob-1">
            <span>User<br />Experience<br />Research</span>
          </div>
          <div className="blob-circle blob-2">
            <span>Data<br />Analysis</span>
          </div>
          <div className="blob-circle blob-3">
            <span>Design<br />Development</span>
          </div>

          <div className="blob-circle blob-4">
            <span>Behavior<br />&<br />Needs<br />Analysis</span>
          </div>
          <div className="blob-circle blob-5">
            <span>Interactive<br />Design</span>
          </div>
          <div className="blob-circle blob-6">
            <span>Visualization<br />Dashboard</span>
          </div>
          <div className="blob-circle blob-7">
            <span>Industrial<br />Design</span>
          </div>

          {/* Modeling & Prediction is overlapping 2 and 4? I'll add it as extra or merge */}
          <div className="blob-circle blob-8">
            <span>Modeling<br />&<br />Prediction</span>
          </div>

          <div className="blob-circle blob-9">
            <span>AI<br />Application</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeSection;
