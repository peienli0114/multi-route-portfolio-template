import { useMemo } from 'react';
import { PortfolioCode } from '../types/portfolio';

type RouteInfo = {
  routeKey: string;
  workCode: PortfolioCode | null;
};

const sanitizeSegments = (value: string): string[] =>
  value
    .replace(/^#?\/?/, '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

export const useRouteKey = (): RouteInfo =>
  useMemo(() => {
    if (typeof window === 'undefined') {
      return { routeKey: 'default', workCode: null };
    }

    const hashSegments = sanitizeSegments(window.location.hash.replace(/^#/, ''));

    if (hashSegments.length > 0) {
      return {
        routeKey: hashSegments[0].toLowerCase(),
        workCode: hashSegments[1] ? hashSegments[1].toLowerCase() : null,
      };
    }

    const pathSegments = sanitizeSegments(
      window.location.pathname.replace(process.env.PUBLIC_URL || '', ''),
    );

    const routeKey = pathSegments[0]?.toLowerCase() || 'default';
    const workCode = pathSegments[1] ? pathSegments[1].toLowerCase() : null;

    return { routeKey, workCode };
  }, []);
