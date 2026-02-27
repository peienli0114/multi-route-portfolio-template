import React from 'react';
import {
  PortfolioCategoryWithMatrix,
  PortfolioCode,
  WorkDetail,
  WorkImages,
} from '../../types/portfolio';
import { resolvePreviewUrl as resolvePreview } from '../../utils/portfolioAssets';

type PortfolioOverviewProps = {
  categories: PortfolioCategoryWithMatrix[];
  activePortfolio: PortfolioCode | null;
  onNavigate: (code: PortfolioCode) => void;
  getYearRangeText: (detail: WorkDetail) => string;
  workImageMap: Record<string, WorkImages>;
  overviewRef?: React.RefObject<HTMLDivElement | null> | null;
  lang?: 'zh' | 'en';
};

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  categories,
  activePortfolio,
  onNavigate,
  getYearRangeText,
  workImageMap,
  overviewRef,
  lang = 'zh',
}) => {
  const isEn = lang === 'en';
  return (
    <div
      ref={overviewRef}
      className="portfolio-overview"
      aria-labelledby="portfolio-overview-heading"
    >
      <div className="portfolio-overview-header">
        {/* <h2 id="portfolio-overview-heading">目錄</h2> */}
        {/* <p>依分類快速預覽作品，點擊卡片即可跳轉至下方詳細介紹。</p> */}
      </div>
      {categories.map((category) => {
        if (!category.items.length) {
          return null;
        }
        const firstItem = category.items[0];
        if (!firstItem) {
          return null;
        }
        return (
          <div
            className="portfolio-overview-category"
            key={`overview-${category.name}`}
          >
            <div className="portfolio-overview-grid">
              <button
                type="button"
                className="portfolio-overview-card portfolio-category-card"
                onClick={() => onNavigate(firstItem.code)}
                aria-label={`前往 ${category.name} 類別`}
              >
                <div className="portfolio-overview-info">
                  <span className="portfolio-category-title">
                    {category.name}
                  </span>
                </div>
              </button>
              {category.items.map((item) => {
                const detail = item.detail;
                const preview = detail.headPic
                  ? resolvePreview(detail.headPic)
                  : workImageMap[item.code.toLowerCase()]?.main || null;
                const displayName = isEn
                  ? (detail.tableNameEn || detail.fullNameEn || detail.tableName || detail.fullName || item.name)
                  : (detail.tableName || detail.fullName || item.name);
                return (
                  <button
                    type="button"
                    key={`overview-card-${item.code}`}
                    className={`portfolio-overview-card${activePortfolio === item.code ? ' is-active' : ''
                      }`}
                    onClick={() => onNavigate(item.code)}
                  >
                    <div className="portfolio-overview-thumb">
                      {preview ? (
                        <img
                          src={preview}
                          alt={`${detail.tableName || item.name} 預覽`}
                        />
                      ) : (
                        <span className="portfolio-overview-placeholder">
                          {isEn ? 'No preview yet' : '尚未提供主圖'}
                        </span>
                      )}
                    </div>
                    <div className="portfolio-overview-info">
                      <span className="portfolio-overview-name">
                        {displayName}
                      </span>
                      {(isEn ? (detail.h2NameEn || detail.h2Name) : detail.h2Name) && (
                        <span className="portfolio-overview-subtitle">
                          {isEn ? (detail.h2NameEn || detail.h2Name) : detail.h2Name}
                        </span>
                      )}
                      {/* {yearText && (
                        <span className="portfolio-overview-year">
                          {yearText}
                        </span>
                      )} */}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PortfolioOverview;
