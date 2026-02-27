import React from 'react';
import {
  ContentKey,
  PortfolioCategory,
  PortfolioCode,
} from '../../types/portfolio';

type SidebarNavProps = {
  selectedContent: ContentKey;
  onSelectContent: (key: ContentKey) => void;
  categories: PortfolioCategory[];
  activePortfolio: PortfolioCode | null;
  expandedCategories: string[];
  onToggleCategory: (categoryName: string) => void;
  onNavigatePortfolio: (code?: PortfolioCode) => void;
  lang?: 'zh' | 'en';
};

const SidebarNav: React.FC<SidebarNavProps> = ({
  selectedContent,
  onSelectContent,
  categories,
  activePortfolio,
  expandedCategories,
  onToggleCategory,
  onNavigatePortfolio,
  lang = 'zh',
}) => {
  const isEn = lang === 'en';
  return (
    <ul>
      <li className="sidebar-section">
        <button
          type="button"
          onClick={() => onSelectContent('home')}
          className={`sidebar-button${selectedContent === 'home' ? ' is-active' : ''
            }`}
        >
          home
        </button>
      </li>
      <li className="sidebar-section">
        <button
          type="button"
          onClick={() => onSelectContent('cv')}
          className={`sidebar-button${selectedContent === 'cv' ? ' is-active' : ''
            }`}
        >
          cv
        </button>
      </li>
      <li className="sidebar-section sidebar-portfolio">
        <button
          type="button"
          onClick={() => onNavigatePortfolio()}
          className={`sidebar-button${selectedContent === 'portfolio' ? ' is-active' : ''
            }`}
        >
          {isEn ? 'Portfolio' : '作品集'}
        </button>
        <div className="sidebar-category-collection">
          <div className="sidebar-subitem">
            <button
              type="button"
              onClick={() => onNavigatePortfolio()}
              className={`sidebar-category-title sidebar-category-title--sub${selectedContent === 'portfolio' && !activePortfolio
                ? ' is-active'
                : ''
                }`}
            >
              {isEn ? 'Portfolio Directory' : '作品集目錄'}
            </button>
          </div>
          {categories.map((category) => {
            const isOpen = expandedCategories.includes(category.name);
            const containsActive = category.items.some(
              (item) => item.code === activePortfolio,
            );
            return (
              <div
                className="sidebar-category-group sidebar-subitem"
                key={category.name}
              >
                <button
                  type="button"
                  className={`sidebar-category-title sidebar-category-title--sub${isOpen ? ' is-open' : ''
                    }${containsActive ? ' is-active' : ''}`}
                  onClick={() => onToggleCategory(category.name)}
                  aria-expanded={isOpen}
                >
                  {category.name}
                  <span className="sidebar-caret" aria-hidden>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>
                {isOpen && (
                  <ul>
                    {category.items.map((item) => (
                      <li key={item.code} className="sidebar-leaf">
                        <button
                          type="button"
                          onClick={() => onNavigatePortfolio(item.code)}
                          className={`sidebar-button sidebar-button--leaf${selectedContent === 'portfolio' &&
                            activePortfolio === item.code
                            ? ' is-active'
                            : ''
                            }`}
                        >
                          {isEn
                            ? (item.detail.tableNameEn || item.detail.fullNameEn || item.detail.tableName || item.name)
                            : (item.detail.tableName || item.name)
                          }
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </li>
    </ul>
  );
};

export default SidebarNav;
