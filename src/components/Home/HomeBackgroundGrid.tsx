import React, { useMemo } from 'react';

type CellConfig = {
  id: string;
  src: string;
  delay: number;
};

const loadImageSources = (): CellConfig[] => {
  try {
    const context = require.context(
      '../../asset/homePage',
      false,
      /\.(png|jpe?g|gif|webp)$/i,
    );
    return context.keys().map((key, index) => ({
      id: `home-bg-${index}`,
      src: context(key) as string,
      delay: 0,
    }));
  } catch {
    return [];
  }
};

const DISTRIBUTION_COUNT = 240;

const HomeBackgroundGrid: React.FC = () => {
  const cells = useMemo<CellConfig[]>(() => {
    const base = loadImageSources();
    if (!base.length) {
      return [];
    }
    const expanded: CellConfig[] = [];
    for (let index = 0; index < DISTRIBUTION_COUNT; index += 1) {
      const source = base[index % base.length];
      expanded.push({
        id: `home-bg-${index}-${source.id}`,
        src: source.src,
        delay: Math.random() * 1.5,
      });
    }
    return expanded.sort(() => Math.random() - 0.5);
  }, []);

  if (!cells.length) {
    return null;
  }

  return (
    <div className="home-background-layer" aria-hidden="true">
      <div className="home-background-grid">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className="home-background-cell"
            style={{ animationDelay: `${cell.delay}s` }}
          >
            <img src={cell.src} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeBackgroundGrid;
