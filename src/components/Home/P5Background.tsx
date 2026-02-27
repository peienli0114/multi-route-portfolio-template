import React, { useEffect, useRef } from 'react';

// ▶ Dynamically load all images from src/asset/homePage/
// Place background images (jpg, png, webp, gif) in that directory for the p5 canvas.
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

const IMAGE_SOURCES = loadHomePageImages();

const P5Background: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const p5Ref = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const module = await import('p5');
      if (cancelled) {
        return;
      }

      const P5Ctor = module.default ?? module;

      const sketch = (p5: any) => {
        let hasCanvas = false;
        let lastSpawn = 0;
        type TextureEntry = { image: any; width: number; height: number };
        let textures: TextureEntry[] = [];

        const ensureCanvas = () => {
          if (!containerRef.current) {
            return;
          }
          const { width, height } =
            containerRef.current.getBoundingClientRect();
          if (!hasCanvas) {
            p5.createCanvas(width, height).parent(containerRef.current);
            p5.background(255);
            hasCanvas = true;
          } else {
            p5.resizeCanvas(width, height);
            p5.background(255);
          }
        };

        const drawRandomImage = () => {
          try {
            if (!hasCanvas) {
              return;
            }
            if (!textures.length) {
              return;
            }
            const entry =
              textures[Math.floor(Math.random() * textures.length)] ?? null;
            if (!entry) {
              return;
            }
            const { image: img, width: sourceWidth, height: sourceHeight } = entry;
            if (!img || sourceWidth <= 0 || sourceHeight <= 0) {
              return;
            }

            const base = Math.max(Math.min(p5.width, p5.height), 1);
            const scale = p5.random(0.25, 0.6);
            const targetWidth = base * scale;
            const aspect = sourceWidth / Math.max(sourceHeight, 1);
            const targetHeight = targetWidth / Math.max(aspect, 0.001);

            const spanX = targetWidth * 0.6;
            const spanY = targetHeight * 0.6;
            const x = p5.random(-spanX, p5.width + spanX);
            const y = p5.random(-spanY, p5.height + spanY);
            const rotation = p5.random(-0.2, 0.2);

            p5.push();
            p5.translate(x, y);
            p5.rotate(rotation);
            p5.tint(255, 220);
            p5.image(img, 0, 0, targetWidth, targetHeight);
            p5.pop();
            p5.noTint();
          } catch (error) {
            console.warn('Skipping p5 background draw', error);
          }
        };

        p5.preload = () => {
          textures = [];
          IMAGE_SOURCES.forEach((src) => {
            try {
              p5.loadImage(
                src,
                (img: any) => {
                  if (!img) {
                    return;
                  }
                  const measuredWidth =
                    typeof img.width === 'number' && img.width > 0
                      ? img.width
                      : typeof img.image?.width === 'number'
                        ? img.image.width
                        : 0;
                  const measuredHeight =
                    typeof img.height === 'number' && img.height > 0
                      ? img.height
                      : typeof img.image?.height === 'number'
                        ? img.image.height
                        : 0;
                  if (measuredWidth > 0 && measuredHeight > 0) {
                    textures.push({
                      image: img,
                      width: measuredWidth,
                      height: measuredHeight,
                    });
                  }
                },
                () => {
                  // ignore load errors silently
                },
              );
            } catch (error) {
              // ignore
            }
          });
        };

        p5.setup = () => {
          ensureCanvas();
          p5.frameRate(60);
          p5.imageMode(p5.CENTER);
        };

        p5.windowResized = () => {
          ensureCanvas();
        };

        p5.draw = () => {
          if (!hasCanvas) {
            return;
          }

          p5.noStroke();
          p5.fill(255, 12);
          p5.rect(0, 0, p5.width, p5.height);

          const now = p5.millis();
          if (now - lastSpawn >= 1000) {
            drawRandomImage();
            lastSpawn = now;
          }
        };
      };

      p5Ref.current = new P5Ctor(sketch);
    };

    load();

    return () => {
      cancelled = true;
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="home-p5-background" aria-hidden="true" />
  );
};

export default P5Background;
