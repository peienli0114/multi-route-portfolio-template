import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PortfolioCode, PortfolioItem, WorkImages } from '../../types/portfolio';
import {
  embedYouTube,
  parseArray,
  resolvePreviewUrl,
} from '../../utils/portfolioAssets';
import ProgressBar from './ProgressBar';

type PortfolioSectionProps = {
  item: PortfolioItem;
  isActive: boolean;
  isExpanded: boolean;
  isFloating: boolean;
  onToggle: (code: PortfolioCode) => void;
  onScrollToTop: (code: PortfolioCode) => void;
  getYearRangeText: (detail: PortfolioItem['detail']) => string;
  workImages: WorkImages;
  progress: number;
  lang: 'zh' | 'en';
};

const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  item,
  isActive,
  isExpanded,
  isFloating,
  onToggle,
  onScrollToTop,
  getYearRangeText,
  workImages,
  progress,
  lang,
}) => {
  const detail = item.detail;
  const isEn = lang === 'en';
  const previewUrl = detail.headPic
    ? resolvePreviewUrl(detail.headPic)
    : workImages.main;

  // Use English fields if available when lang is 'en', fall back to Chinese
  const rawIntro = isEn
    ? (detail.introEn?.trim() || detail.intro?.trim())
    : detail.intro?.trim();
  const introText = rawIntro || (isEn ? 'Description coming soon.' : '這個作品的介紹尚未補充，歡迎之後回來看看。');

  const introListItems = useMemo(
    () => {
      const sourceList = isEn
        ? (detail.introListEn?.length ? detail.introListEn : detail.introList)
        : detail.introList;
      return (sourceList ?? [])
        .map((item) => (item || '').trim())
        .filter(Boolean);
    },
    [detail.introList, detail.introListEn, isEn],
  );

  type IntroBlock =
    | { type: 'paragraph'; content: string }
    | { type: 'list'; content: string[] };

  const introBlocks: IntroBlock[] = useMemo(() => {
    const lines = introText
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trim());

    const result: IntroBlock[] = [];
    let paragraphBuffer: string[] = [];
    let listBuffer: string[] = [];

    const flushParagraph = () => {
      if (paragraphBuffer.length === 0) {
        return;
      }
      const paragraph = paragraphBuffer.join(' ').replace(/\s+/g, ' ').trim();
      if (paragraph) {
        result.push({ type: 'paragraph', content: paragraph });
      }
      paragraphBuffer = [];
    };

    const flushList = () => {
      if (listBuffer.length === 0) {
        return;
      }
      result.push({ type: 'list', content: listBuffer });
      listBuffer = [];
    };

    const bulletPattern = /^[\u2022\u2023\u25E6\u2043\u2219\u30FB・．•\-＊*]/;

    lines.forEach((line) => {
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }
      if (bulletPattern.test(line)) {
        const normalized = line.replace(bulletPattern, '').trim();
        if (paragraphBuffer.length > 0) {
          flushParagraph();
        }
        if (normalized) {
          listBuffer.push(normalized);
        }
      } else {
        if (listBuffer.length > 0) {
          flushList();
        }
        paragraphBuffer.push(line);
      }
    });

    flushParagraph();
    flushList();

    if (introListItems.length > 0) {
      result.push({ type: 'list', content: introListItems });
    }

    return result.length > 0
      ? result
      : [{ type: 'paragraph', content: introText.replace(/\s+/g, ' ').trim() }];
  }, [introText, introListItems]);

  const yearRange = getYearRangeText(detail);
  const fullDisplayName = isEn
    ? (detail.fullNameEn || detail.fullName || detail.tableNameEn || detail.tableName || item.name)
    : (detail.fullName || detail.tableName || item.name);
  const sidebarDisplayName = isEn
    ? (detail.tableNameEn || detail.tableName || item.name)
    : (detail.tableName || item.name);
  const tags = isEn
    ? (detail.tagsEn?.length ? detail.tagsEn : detail.tags ?? [])
    : (detail.tags ?? []);
  const galleryItems = useMemo(
    () =>
      workImages.gallery.filter((galleryItem) =>
        previewUrl ? galleryItem.src !== previewUrl : true,
      ),
    [workImages.gallery, previewUrl],
  );
  const videoUrls = useMemo(
    () =>
      parseArray(detail.content).filter((link) =>
        /youtube\.com|youtu\.be/.test(link),
      ),
    [detail.content],
  );
  const links = detail.links ?? [];
  const coWorkers = detail.coWorkers ?? [];
  const hasLinks = links.length > 0;
  const hasCoWorkers = coWorkers.length > 0;

  const computePdfEmbedSupport = useCallback(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const ua =
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(ua);
    const prefersCompactViewport =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(max-width: 768px)').matches
        : window.innerWidth <= 768;
    return !(isMobileUa || prefersCompactViewport);
  }, []);

  const [supportsInlinePdf, setSupportsInlinePdf] = useState(() =>
    computePdfEmbedSupport(),
  );
  const [expandedImages, setExpandedImages] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const media = window.matchMedia('(max-width: 768px)');
    const handleChange = () => {
      setSupportsInlinePdf(computePdfEmbedSupport());
    };
    handleChange();
    media.addEventListener('change', handleChange);
    window.addEventListener('orientationchange', handleChange);
    return () => {
      media.removeEventListener('change', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, [computePdfEmbedSupport]);

  const handleScrollToBottom = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const detailsEl = document.getElementById(
      `portfolio-${item.code}-details`,
    );
    if (!detailsEl) {
      return;
    }
    const bottom =
      detailsEl.getBoundingClientRect().bottom + window.scrollY;
    const target = Math.max(bottom - window.innerHeight + 16, 0);
    window.scrollTo({ top: target, behavior: 'smooth' });
  }, [item.code]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px)').matches;

  const toggleImageExpansion = (src: string) => {
    if (isMobileViewport()) {
      return;
    }
    setExpandedImages((previous) => {
      const next = new Set(previous);
      if (next.has(src)) {
        next.delete(src);
      } else {
        next.add(src);
      }
      return next;
    });
  };

  return (
    <section
      id={`portfolio-${item.code}`}
      data-code={item.code}
      className={`portfolio-section${isActive ? ' is-active' : ''}`}
    >
      <div
        className="portfolio-summary-block"
        id={`portfolio-${item.code}-summary`}
      >
        <div className="portfolio-preview">
          {previewUrl ? (
            <img src={previewUrl} alt={`${fullDisplayName} 主視覺`} />
          ) : (
            <span className="portfolio-preview-placeholder">
              主要視覺尚未提供
            </span>
          )}
        </div>
        <div className="portfolio-summary-text">
          <div className="portfolio-heading portfolio-heading-inline">
            <h2>{fullDisplayName}</h2>
          </div>
          {(isEn ? (detail.h2NameEn || detail.h2Name) : detail.h2Name) && (
            <p className="portfolio-subtitle">{isEn ? (detail.h2NameEn || detail.h2Name) : detail.h2Name}</p>
          )}
          {tags.length > 0 && (
            <div className="portfolio-tags">
              <span className="portfolio-tag">
                {tags.join(' | ')}
              </span>
            </div>
          )}
          {introBlocks.map((block, index) => {
            if (block.type === 'paragraph') {
              return <p key={`intro-paragraph-${index}`}>{block.content}</p>;
            }
            return (
              <ul className="portfolio-detail-list" key={`intro-list-${index}`}>
                {block.content.map((item, itemIndex) => (
                  <li key={`intro-list-item-${index}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );
          })}
          <div className="portfolio-summary-footer">
            {yearRange ? (
              <span className="portfolio-year">{yearRange}</span>
            ) : (
              <span className="portfolio-year" />
            )}
            {!isExpanded && (
              <button
                type="button"
                className="portfolio-toggle preview-toggle"
                onClick={() => onToggle(item.code)}
              >
                {isEn ? 'Read More' : '閱讀更多'}
              </button>
            )}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div
          className="portfolio-details"
          id={`portfolio-${item.code}-details`}
        >
          <div className="portfolio-detail-sticky">
            <div
              className={`portfolio-detail-banner portfolio-detail-banner-sticky${isFloating ? ' is-floating' : ''
                }`}
              aria-hidden={isFloating}
            >
              <div className="portfolio-detail-banner-row">
                <div className="portfolio-detail-banner-info">
                  <strong>{sidebarDisplayName}</strong>
                  {isFloating && <ProgressBar progress={progress} />}
                </div>
                <div className="portfolio-detail-banner-actions">
                  <button
                    type="button"
                    onClick={handleScrollToBottom}
                  >
                    {isEn ? 'Bottom↓' : '到底部↓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onScrollToTop(item.code)}
                  >
                    {isEn ? 'Top↑' : '回到頂部↑'}
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => onToggle(item.code)}
                  >
                    {isEn ? 'Collapse' : '收合'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {(hasLinks || hasCoWorkers) && (
            <div className="portfolio-meta-flex">
              {hasLinks && (
                <div className="portfolio-meta-block portfolio-meta-links">
                  <h4 className="portfolio-meta-title">{isEn ? 'Links' : '相關連結'}</h4>
                  <ul className="portfolio-meta-list">
                    {links.map((item, index) => (
                      <li key={`link-inline-${index}`}>
                        {item.link ? (
                          <a
                            href={item.link}
                            className="portfolio-meta-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.name || item.link}
                          </a>
                        ) : (
                          item.name || item.link
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hasCoWorkers && (
                <div className="portfolio-meta-block portfolio-meta-team">
                  <h4 className="portfolio-meta-title">{isEn ? 'Team' : '專案成員'}</h4>
                  <ul className="portfolio-meta-list">
                    {coWorkers.map((person, index) => (
                      <li key={`coworker-inline-${index}`}>
                        <span className="portfolio-meta-name">
                          {person.name || '協作者'}
                        </span>
                        {person.work && (
                          <span className="portfolio-meta-note">{person.work}</span>
                        )}
                        {person.link && (
                          <a
                            href={person.link}
                            className="portfolio-meta-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            連結
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {(galleryItems.length > 0 || videoUrls.length > 0) && (
            <div className="portfolio-gallery">
              {galleryItems.map((galleryItem, index) => {
                if (galleryItem.type === 'pdf') {
                  if (!supportsInlinePdf) {
                    return (
                      <a
                        key={`pdf-link-${index}`}
                        href={galleryItem.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portfolio-pdf-link"
                      >
                        <span>查看 {fullDisplayName} PDF</span>
                      </a>
                    );
                  }
                  return (
                    <object
                      key={`pdf-${index}`}
                      data={galleryItem.src}
                      type="application/pdf"
                      className="portfolio-preview-pdf"
                      aria-label={`${fullDisplayName} PDF ${index + 1}`}
                    >
                      <a
                        href={galleryItem.src}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        下載 {fullDisplayName} PDF
                      </a>
                    </object>
                  );
                }
                const isExpanded = expandedImages.has(galleryItem.src);
                return (
                  <div
                    key={`img-${index}`}
                    className={`portfolio-gallery-image-wrapper${isExpanded ? ' is-contained' : ''
                      }`}
                  >
                    <img
                      src={galleryItem.src}
                      alt={`${fullDisplayName} 內容圖像 ${index + 1}`}
                      className={`portfolio-gallery-image${isExpanded ? ' is-expanded' : ''
                        }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleImageExpansion(galleryItem.src)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleImageExpansion(galleryItem.src);
                        }
                      }}
                    />
                  </div>
                );
              })}
              {videoUrls.map((video, index) => (
                <iframe
                  key={`video-${index}`}
                  src={embedYouTube(video)}
                  title={`${fullDisplayName} 影片 ${index + 1}`}
                  className="portfolio-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PortfolioSection;
