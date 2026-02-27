import React from 'react';
import { PortfolioFooterContent } from '../../types/portfolio';
import Footer from '../Footer/Footer';

type LayoutProps = {
  sidebar: React.ReactNode;
  mobileNavMenu: React.ReactNode;
  children: React.ReactNode;
  isSidebarCollapsed: boolean;
  onSidebarExpand: () => void;
  isMobileNavOpen: boolean;
  onMobileNavToggle: () => void;
  mobileTitle: string;
  mobileActions?: React.ReactNode;
  footerContent: PortfolioFooterContent;
};

const Layout: React.FC<LayoutProps> = ({
  sidebar,
  mobileNavMenu,
  children,
  isSidebarCollapsed,
  onSidebarExpand,
  isMobileNavOpen,
  onMobileNavToggle,
  mobileTitle,
  mobileActions,
  footerContent,
}) => (
  <div className={`layout${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    {isSidebarCollapsed && (
      <button
        type="button"
        className="sidebar-collapse-toggle desktop-only"
        onClick={onSidebarExpand}
        aria-expanded={!isSidebarCollapsed}
      >
        ▶
      </button>
    )}
    <header className={`mobile-nav${isMobileNavOpen ? ' is-open' : ''}`}>
      <div className="mobile-nav-inner">
        <div className="mobile-nav-bar">
          <h1 className="sidebar-title">{mobileTitle}</h1>
          <div className="mobile-nav-controls">
            {mobileActions}
            <button
              type="button"
              className="sidebar-toggle"
              onClick={onMobileNavToggle}
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-nav"
            >
              {isMobileNavOpen ? '關閉目錄' : '展開目錄'}
            </button>
          </div>
        </div>
        <nav id="mobile-nav" className="nav-menu">
          {mobileNavMenu}
        </nav>
      </div>
    </header>
    <aside className="panel panel-left" data-mobile-nav>
      {sidebar}
    </aside>
    <section className="panel panel-right">
      {children}
      <Footer content={footerContent} />
    </section>
  </div>
);

export default Layout;
