import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Analytics } from '@vercel/analytics/react';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

const computeRoutePath = () => {
  if (typeof window === 'undefined') {
    return '/';
  }
  const basePath = process.env.PUBLIC_URL || '';
  const rawPath = window.location.pathname.replace(basePath, '') || '/';
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const hash = window.location.hash || '';
  return `${path}${hash}`;
};

const HashAnalytics: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>(computeRoutePath);

  useEffect(() => {
    const handleChange = () => {
      setCurrentRoute(computeRoutePath());
    };
    window.addEventListener('hashchange', handleChange);
    window.addEventListener('popstate', handleChange);
    return () => {
      window.removeEventListener('hashchange', handleChange);
      window.removeEventListener('popstate', handleChange);
    };
  }, []);

  return <Analytics route={currentRoute} path={currentRoute} />;
};

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <HashAnalytics />
    </BrowserRouter>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
