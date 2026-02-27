import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const useGaPageView = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }
    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
    });
  }, [location]);
};

export default useGaPageView;
