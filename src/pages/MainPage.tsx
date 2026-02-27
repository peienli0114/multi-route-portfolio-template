import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import '../main.css';
import Layout from '../components/Layout/Layout';
import Sidebar from '../components/Sidebar/Sidebar';
import SidebarNav from '../components/Sidebar/SidebarNav';
import HomeSection from '../components/Home/HomeSection';
import CvViewer from '../components/CvViewer/CvViewer';
import PortfolioContent from '../components/Portfolio/PortfolioContent';
import { ContentKey, PortfolioCode } from '../types/portfolio';
import { useRouteKey } from '../hooks/useRouteKey';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { usePortfolioScrollSpy } from '../hooks/usePortfolioScrollSpy';
import { useExperienceData } from '../hooks/useExperienceData';
import ProgressBar from '../components/Portfolio/ProgressBar';

type FloatingBannerState = {
  code: PortfolioCode;
  title: string;
  left: number;
  width: number;
  top: number;
};

const Main: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<ContentKey>('home');
  const [activePortfolio, setActivePortfolio] =
    useState<PortfolioCode | null>(null);
  const [expandedWorks, setExpandedWorks] = useState<PortfolioCode[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [floatingBannerState, setFloatingBannerState] =
    useState<FloatingBannerState | null>(null);
  const [progress, setProgress] = useState(0);
  const homeSectionRef = useRef<HTMLDivElement | null>(null);
  const cvSectionRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const portfolioSectionRef = useRef<HTMLDivElement | null>(null);
  const lastSectionRef = useRef<ContentKey>('home');
  const sidebarAnchorSnapshotRef = useRef<{
    anchorId: string | null;
    offset: number;
  } | null>(null);
  const previousSidebarStateRef = useRef(isSidebarCollapsed);
  const initialWorkHandledRef = useRef(false);

  const { routeKey, workCode: initialWorkCode } = useRouteKey();
  const {
    categories,
    categoriesWithMatrix,
    portfolioItems,
    workDetailMap,
    workImageMap,
    getYearRangeText,
    cvSettings,
    homeContent,
    siteTitle,
    sidebarTitle,
    cvSummary,
    footerContent,
    routeSkills,
    lang,
  } = usePortfolioData(routeKey);
  const experienceGroups = useExperienceData(cvSettings.groups);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = siteTitle;
    }
  }, [siteTitle]);

  const deepLinkedWorkCode = useMemo(() => {
    if (!initialWorkCode) {
      return null;
    }
    const target = portfolioItems.find(
      (item) => item.code.toLowerCase() === initialWorkCode,
    );
    return target?.code ?? null;
  }, [initialWorkCode, portfolioItems]);

  useEffect(() => {
    initialWorkHandledRef.current = false;
  }, [routeKey]);

  const readMobileNavHeight = useCallback(() => {
    if (typeof document === 'undefined') {
      return 0;
    }
    const nav = document.querySelector<HTMLElement>('.mobile-nav');
    return nav ? nav.offsetHeight : 0;
  }, []);

  const updateMobileNavHeightVar = useCallback(() => {
    if (typeof document === 'undefined') {
      return 0;
    }
    const prefersMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches;
    const height = prefersMobile ? readMobileNavHeight() : 0;
    document.documentElement.style.setProperty(
      '--mobile-nav-height',
      `${height}px`,
    );
    return height;
  }, [readMobileNavHeight]);

  useEffect(() => {
    updateMobileNavHeightVar();
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      updateMobileNavHeightVar();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateMobileNavHeightVar]);

  useEffect(() => {
    updateMobileNavHeightVar();
  }, [isMobileNavOpen, updateMobileNavHeightVar]);

  const getScrollOffset = useCallback(() => {
    if (typeof window === 'undefined') {
      return 0;
    }
    if (!window.matchMedia('(max-width: 768px)').matches) {
      return 0;
    }
    const stored = document.documentElement.style.getPropertyValue(
      '--mobile-nav-height',
    );
    const parsed = parseInt(stored, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    return updateMobileNavHeightVar();
  }, [updateMobileNavHeightVar]);

  const closeNavOnMobile = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches
    ) {
      setIsMobileNavOpen(false);
    }
  }, []);

  const scrollToElement = useCallback(
    (element: HTMLElement | null) => {
      if (!element || typeof window === 'undefined') {
        return;
      }
      const offset = getScrollOffset();
      const rect = element.getBoundingClientRect();
      const position = rect.top + window.scrollY - offset - 16;
      window.scrollTo({ top: position, behavior: 'smooth' });
    },
    [getScrollOffset],
  );

  const scrollToPortfolioSection = useCallback(
    (code: PortfolioCode | undefined, attempt = 0) => {
      if (!code) {
        return;
      }
      const section = document.getElementById(`portfolio-${code}`);
      if (!section) {
        if (attempt < 6) {
          setTimeout(() => scrollToPortfolioSection(code, attempt + 1), 80);
        }
        return;
      }
      scrollToElement(section);
    },
    [scrollToElement],
  );

  const scrollToPortfolioBottom = useCallback(
    (code: PortfolioCode) => {
      if (typeof window === 'undefined') {
        return;
      }
      const detailsEl = document.getElementById(
        `portfolio-${code}-details`,
      );
      if (!detailsEl) {
        return;
      }
      const offset = getScrollOffset();
      const rect = detailsEl.getBoundingClientRect();
      const bottom =
        rect.bottom + window.scrollY - window.innerHeight + offset + 24;
      window.scrollTo({
        top: Math.max(bottom, 0),
        behavior: 'smooth',
      });
    },
    [getScrollOffset],
  );

  const toggleCategoryCollapse = useCallback((categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName],
    );
  }, []);

  const updateExpandedCategories = useCallback(
    (categoryName: string | null, collapseOthers = false) => {
      if (!categoryName) {
        return;
      }
      setExpandedCategories((prev) => {
        const already = prev.includes(categoryName);
        if (collapseOthers) {
          return already && prev.length === 1 && prev[0] === categoryName
            ? prev
            : [categoryName];
        }
        if (already) {
          return prev;
        }
        return [...prev, categoryName];
      });
    },
    [],
  );

  const handlePortfolioNavClick = useCallback(
    (code?: PortfolioCode) => {
      setSelectedContent('portfolio');
      closeNavOnMobile();
      if (code) {
        setActivePortfolio(code);
        const matchedCategory = categoriesWithMatrix.find((category) =>
          Boolean(category.itemsMap[code]),
        );
        const collapseOthers =
          typeof window !== 'undefined' &&
          !window.matchMedia('(max-width: 768px)').matches;
        updateExpandedCategories(matchedCategory?.name ?? null, collapseOthers);
      } else {
        setActivePortfolio(null);
      }

      requestAnimationFrame(() => {
        const targetCode = code ?? portfolioItems[0]?.code;
        if (code && targetCode) {
          scrollToPortfolioSection(targetCode);
          return;
        }

        if (typeof window === 'undefined') {
          return;
        }
        const anchorElement = portfolioSectionRef.current || overviewRef.current;
        if (!anchorElement) {
          return;
        }
        const offset = getScrollOffset();
        const position =
          anchorElement.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top: position, behavior: 'smooth' });
      });
    },
    [
      categoriesWithMatrix,
      closeNavOnMobile,
      getScrollOffset,
      portfolioItems,
      scrollToPortfolioSection,
      updateExpandedCategories,
    ],
  );

  const handleSelectContent = useCallback(
    (key: ContentKey) => {
      if (key === 'portfolio') {
        handlePortfolioNavClick();
        return;
      }
      setSelectedContent(key);
      closeNavOnMobile();
      setActivePortfolio(null);
      if (key === 'home') {
        scrollToElement(homeSectionRef.current);
      } else if (key === 'cv') {
        scrollToElement(cvSectionRef.current);
      }
    },
    [
      closeNavOnMobile,
      handlePortfolioNavClick,
      scrollToElement,
    ],
  );

  useEffect(() => {
    setExpandedCategories([]);
    // Remove the forced expansion here, as it will be handled by the selectedContent effect
    // setIsSidebarCollapsed(false);
  }, [routeKey, categoriesWithMatrix]);



  useEffect(() => {
    if (selectedContent !== 'portfolio') {
      setActivePortfolio(null);
      return;
    }

    setActivePortfolio((current) => {
      if (portfolioItems.length === 0) {
        return null;
      }
      const stillExists = current
        ? portfolioItems.some((item) => item.code === current)
        : false;
      return stillExists ? current : null;
    });
  }, [portfolioItems, selectedContent]);

  useEffect(() => {
    setExpandedWorks((prev) =>
      prev.filter((code) => portfolioItems.some((item) => item.code === code)),
    );
  }, [portfolioItems]);

  const captureSidebarAnchorPosition = useCallback(() => {
    if (selectedContent !== 'portfolio' || !activePortfolio) {
      sidebarAnchorSnapshotRef.current = {
        anchorId: null,
        offset: window.scrollY,
      };
      return;
    }
    const useDetails = expandedWorks.includes(activePortfolio);
    const anchorId = useDetails
      ? `portfolio-${activePortfolio}-details`
      : `portfolio-${activePortfolio}-summary`;
    const anchorElement = document.getElementById(anchorId);
    if (!anchorElement) {
      sidebarAnchorSnapshotRef.current = {
        anchorId: null,
        offset: window.scrollY,
      };
      return;
    }
    const anchorTop = anchorElement.getBoundingClientRect().top + window.scrollY;
    sidebarAnchorSnapshotRef.current = {
      anchorId,
      offset: window.scrollY - anchorTop,
    };
  }, [activePortfolio, expandedWorks, selectedContent]);

  useEffect(() => {
    if (previousSidebarStateRef.current === isSidebarCollapsed) {
      return;
    }
    previousSidebarStateRef.current = isSidebarCollapsed;
    const snapshot = sidebarAnchorSnapshotRef.current;
    sidebarAnchorSnapshotRef.current = null;
    const timeoutId = window.setTimeout(() => {
      if (snapshot?.anchorId) {
        const anchorElement = document.getElementById(snapshot.anchorId);
        if (anchorElement) {
          const anchorTop = anchorElement.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: anchorTop + snapshot.offset, behavior: 'auto' });
          window.dispatchEvent(new Event('resize'));
          return;
        }
      }
      if (snapshot) {
        window.scrollTo({ top: Math.max(snapshot.offset, 0), behavior: 'auto' });
      }
      window.dispatchEvent(new Event('resize'));
    }, 320);
    return () => window.clearTimeout(timeoutId);
  }, [isSidebarCollapsed]);

  const scrollSummaryIntoView = useCallback(
    (code: PortfolioCode) => {
      if (typeof window === 'undefined') {
        return;
      }
      const summaryEl = document.getElementById(
        `portfolio-${code}-summary`,
      );
      if (!summaryEl) {
        return;
      }
      const offset = getScrollOffset();
      const rect = summaryEl.getBoundingClientRect();
      const top = rect.top + window.scrollY - offset - 16;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    },
    [getScrollOffset],
  );

  const toggleWork = useCallback(
    (code: PortfolioCode) => {
      setExpandedWorks((prev) => {
        const willCollapse = prev.includes(code);
        const next = willCollapse
          ? prev.filter((item) => item !== code)
          : [...prev, code];
        if (willCollapse) {
          requestAnimationFrame(() => {
            scrollSummaryIntoView(code);
          });
        }
        return next;
      });
    },
    [scrollSummaryIntoView],
  );

  useEffect(() => {
    if (!deepLinkedWorkCode || initialWorkHandledRef.current) {
      return;
    }
    initialWorkHandledRef.current = true;
    handlePortfolioNavClick(deepLinkedWorkCode);
    setExpandedWorks((prev) =>
      prev.includes(deepLinkedWorkCode)
        ? prev
        : [...prev, deepLinkedWorkCode],
    );
  }, [deepLinkedWorkCode, handlePortfolioNavClick]);

  usePortfolioScrollSpy({
    enabled: selectedContent === 'portfolio',
    portfolioItems,
    categoriesWithMatrix,
    getScrollOffset,
    onActiveChange: setActivePortfolio,
    updateExpandedCategories,
    isMobileNavOpen,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const activeCode = activePortfolio;
    if (!activeCode || !expandedWorks.includes(activeCode)) {
      setFloatingBannerState(null);
      return;
    }

    const activeItem = portfolioItems.find(
      (entry) => entry.code === activeCode,
    );
    if (!activeItem) {
      setFloatingBannerState(null);
      return;
    }

    const summaryEl = document.getElementById(
      `portfolio-${activeCode}-summary`,
    );
    const detailsEl = document.getElementById(
      `portfolio-${activeCode}-details`,
    );
    const bannerEl =
      detailsEl?.querySelector<HTMLDivElement>('.portfolio-detail-banner') ??
      null;

    if (!summaryEl || !detailsEl || !bannerEl) {
      setFloatingBannerState(null);
      return;
    }

    const title = lang === 'en'
      ? (activeItem.detail.tableNameEn || activeItem.detail.fullNameEn || activeItem.detail.tableName || activeItem.detail.fullName || activeItem.name)
      : (activeItem.detail.tableName || activeItem.detail.fullName || activeItem.name);

    let rafId: number | null = null;

    const update = () => {
      const offset = getScrollOffset();
      const top = offset;
      // 作品banner位置 offset置頂
      const summaryBottom =
        summaryEl.getBoundingClientRect().bottom + window.scrollY;
      const bannerRect = bannerEl.getBoundingClientRect();
      const detailsRect = detailsEl.getBoundingClientRect();
      const detailsBottom = detailsRect.bottom + window.scrollY;
      const floatingTop = window.scrollY + top;
      const rawStopThreshold = detailsBottom - bannerRect.height - 12;
      const minStopThreshold = summaryBottom + 8;
      const stopThreshold = Math.max(rawStopThreshold, minStopThreshold);
      const bottomLimit = detailsBottom - 12;

      const shouldFloat =
        window.scrollY + offset + 40 > summaryBottom &&
        floatingTop <= stopThreshold &&
        floatingTop < bottomLimit;

      if (!shouldFloat) {
        setFloatingBannerState((previous) => (previous ? null : previous));
        return;
      }

      const safeMargin = 16;
      let left = bannerRect.left;
      let width = bannerRect.width;

      if (left < safeMargin) {
        const delta = safeMargin - left;
        left = safeMargin;
        width = Math.max(width - delta, 280);
      }

      let overflowRight = left + width + safeMargin - window.innerWidth;
      if (overflowRight > 0) {
        const shift = Math.min(overflowRight, left - safeMargin);
        if (shift > 0) {
          left -= shift;
          overflowRight -= shift;
        }
        if (overflowRight > 0) {
          width = Math.max(width - overflowRight, 280);
        }
      }

      let availableWidth = window.innerWidth - left - safeMargin;
      if (availableWidth <= 0) {
        left = safeMargin;
        availableWidth = Math.max(window.innerWidth - safeMargin * 2, 0);
      }
      width = Math.min(width, availableWidth);

      const nextState: FloatingBannerState = {
        code: activeCode,
        title,
        left,
        width,
        top,
      };

      setFloatingBannerState((previous) => {
        if (
          previous &&
          previous.code === nextState.code &&
          previous.title === nextState.title &&
          Math.abs(previous.left - nextState.left) < 0.5 &&
          Math.abs(previous.width - nextState.width) < 0.5 &&
          Math.abs(previous.top - nextState.top) < 0.5
        ) {
          return previous;
        }
        return nextState;
      });
    };

    const handle = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [activePortfolio, expandedWorks, getScrollOffset, portfolioItems, lang]);

  useEffect(() => {
    if (!activePortfolio || !expandedWorks.includes(activePortfolio)) {
      setProgress(0);
      return;
    }
    const detailsEl = document.getElementById(
      `portfolio-${activePortfolio}-details`,
    );
    if (!detailsEl) {
      return;
    }
    const handleScroll = () => {
      const { top, height } = detailsEl.getBoundingClientRect();
      const newProgress = Math.max(
        0,
        Math.min(1, (window.innerHeight - top) / height),
      );
      setProgress(newProgress * 100);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activePortfolio, expandedWorks]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const sections: Array<{ key: ContentKey; ref: React.RefObject<HTMLDivElement | null> }> = [
      { key: 'home', ref: homeSectionRef },
      { key: 'cv', ref: cvSectionRef },
      { key: 'portfolio', ref: portfolioSectionRef },
    ];

    const handleScroll = () => {
      const offset = getScrollOffset();
      const referenceY = window.scrollY + offset + window.innerHeight * 0.25;
      let currentKey: ContentKey = 'home';

      sections.forEach(({ key, ref }) => {
        const element = ref.current;
        if (!element) {
          return;
        }
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (referenceY >= top) {
          currentKey = key;
        }
      });

      if (currentKey !== lastSectionRef.current) {
        lastSectionRef.current = currentKey;
        setSelectedContent(currentKey);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [getScrollOffset]);

  const navProps = useMemo(
    () => ({
      selectedContent,
      onSelectContent: handleSelectContent,
      categories,
      activePortfolio,
      expandedCategories,
      onToggleCategory: toggleCategoryCollapse,
      onNavigatePortfolio: handlePortfolioNavClick,
      lang,
    }),
    [
      activePortfolio,
      categories,
      expandedCategories,
      handlePortfolioNavClick,
      handleSelectContent,
      selectedContent,
      toggleCategoryCollapse,
      lang,
    ],
  );

  const floatingBannerStyle = useMemo(() => {
    if (!floatingBannerState) {
      return undefined;
    }
    const baseTop = `${floatingBannerState.top}px`;
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return {
        top: baseTop,
        left: 0,
        right: 0,
        width: '100%',
      } as React.CSSProperties;
    }
    return {
      top: baseTop,
      left: `${floatingBannerState.left}px`,
      width: `${floatingBannerState.width}px`,
    } as React.CSSProperties;
  }, [floatingBannerState]);

  const floatingBannerPortal =
    floatingBannerState && typeof document !== 'undefined'
      ? createPortal(
        <div
          className="portfolio-detail-banner portfolio-detail-banner-floating"
          style={floatingBannerStyle}
        >
          <div className="portfolio-detail-banner-row">
            <div className="portfolio-detail-banner-info">
              <strong>{floatingBannerState.title}</strong>
            </div>
            <div className="portfolio-detail-banner-actions">
              <button
                type="button"
                onClick={() =>
                  scrollToPortfolioBottom(floatingBannerState.code)
                }
              >
                {lang === 'en' ? 'Bottom↓' : '到底部↓'}
              </button>
              <button
                type="button"
                onClick={() =>
                  scrollToPortfolioSection(floatingBannerState.code)
                }
              >
                {lang === 'en' ? 'Top↑' : '回到頂部↑'}
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => toggleWork(floatingBannerState.code)}
              >
                {lang === 'en' ? 'Collapse' : '收合'}
              </button>
            </div>
          </div>
          <ProgressBar progress={progress} />
        </div>,
        document.body,
      )
      : null;

  return (
    <Layout
      sidebar={
        <Sidebar
          title={sidebarTitle}
          isCollapsed={isSidebarCollapsed}
          onCollapseToggle={() => {
            captureSidebarAnchorPosition();
            setIsSidebarCollapsed((previous) => !previous);
          }}
        >
          <SidebarNav {...navProps} />
        </Sidebar>
      }
      mobileActions={
        <div className="mobile-nav-quick-links">
          <button
            type="button"
            className="mobile-nav-quick-link"
            onClick={() => handleSelectContent('cv')}
          >
            CV
          </button>
          <button
            type="button"
            className="mobile-nav-quick-link"
            onClick={() => handleSelectContent('portfolio')}
          >
            作品集
          </button>
        </div>
      }
      mobileNavMenu={<SidebarNav {...navProps} />}
      isSidebarCollapsed={isSidebarCollapsed}
      onSidebarExpand={() => {
        captureSidebarAnchorPosition();
        setIsSidebarCollapsed(false);
      }}
      isMobileNavOpen={isMobileNavOpen}
      onMobileNavToggle={() =>
        setIsMobileNavOpen((previous) => !previous)
      }
      mobileTitle={sidebarTitle}
      footerContent={footerContent}
    >
      {floatingBannerPortal}
      <div className="page-sections">
        <section
          className="page-section"
          id="section-home"
          ref={homeSectionRef}
        >
          <HomeSection
            content={homeContent}
            onNavigateCv={() => handleSelectContent('cv')}
            onNavigatePortfolio={() => handlePortfolioNavClick()}
          />
        </section>
        <section
          className="page-section"
          id="section-cv"
          ref={cvSectionRef}
        >
          <CvViewer
            settings={cvSettings}
            experienceGroups={experienceGroups}
            workDetailMap={workDetailMap}
            summaryBlocks={cvSummary}
            onNavigateToWork={(code) => handlePortfolioNavClick(code)}
            routeSkills={routeSkills}
          />
        </section>
        <section
          className="page-section"
          id="section-portfolio"
          ref={portfolioSectionRef}
        >
          <PortfolioContent
            categories={categoriesWithMatrix}
            activePortfolio={activePortfolio}
            expandedWorks={expandedWorks}
            onToggleWork={toggleWork}
            onNavigate={handlePortfolioNavClick}
            getYearRangeText={getYearRangeText}
            workImageMap={workImageMap}
            overviewRef={overviewRef}
            floatingWorkCode={floatingBannerState?.code ?? null}
            progress={progress}
            lang={lang}
          />
        </section>
      </div>
    </Layout>
  );
};

export default Main;
