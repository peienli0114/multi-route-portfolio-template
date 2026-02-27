import { useCallback, useMemo } from 'react';
import portfolioMap from '../work_list/portfolioMap.json';
import portfolioRoutes from '../work_list/portfolioRoutes.json';
import workDetails from '../work_list/allWorkData.json';
import {
  BlobConfig,
  PortfolioCategory,
  PortfolioCategoryWithMatrix,
  PortfolioCode,
  PortfolioItem,
  PortfolioRouteConfig,
  PortfolioRouteEntry,
  CvRouteValue,
  CvSettings,
  WorkDetail,
  PortfolioHomeContent,
  PortfolioHomeConfig,
  PortfolioFooterConfig,
  PortfolioFooterContent,
  SkillGroupData,
} from '../types/portfolio';
import {
  WORK_IMAGE_MAP,
  createFallbackDetail,
} from '../utils/portfolioAssets';

const ROUTE_CONFIG = portfolioRoutes as PortfolioRouteConfig;
const DEFAULT_ROUTE_ENTRY: PortfolioRouteEntry = ROUTE_CONFIG.default ?? {};
const loadCvAssets = (): Record<string, string> => {
  try {
    const context = require.context('../asset/cv', false, /\.pdf$/);
    return context.keys().reduce<Record<string, string>>((acc, key) => {
      const assetKey = key.replace('./', '');
      try {
        acc[assetKey] = context(key) as string;
      } catch {
        // Skip missing assets so build continues even if files were removed.
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const CV_ASSETS = loadCvAssets();

const workDetailMap = workDetails as Record<string, WorkDetail>;

const getPortfolioName = (code: string): string | undefined =>
  portfolioMap[code as keyof typeof portfolioMap];

const defaultCodes = Object.keys(portfolioMap).sort((a, b) =>
  a.localeCompare(b),
);

const DEFAULT_BLOBS: BlobConfig[] = [
  { id: 'blob-1', label: 'User\nExperience\nResearch', size: 'large', x: '25%', y: '10%', width: '40%', color: '#fd9225', animDuration: 7, animDelay: 0 },
  { id: 'blob-2', label: 'Data\nAnalysis', size: 'large', x: '5%', y: '40%', width: '40%', color: '#44acaf', animDuration: 8, animDelay: 1 },
  { id: 'blob-3', label: 'Design\nDevelopment', size: 'large', x: '40%', y: '45%', width: '40%', color: '#ff6b6b', animDuration: 6, animDelay: 2 },
  { id: 'blob-4', label: 'Behavior\n&\nNeeds\nAnalysis', size: 'small', x: '15%', y: '15%', animDuration: 9, animDelay: 0.5 },
  { id: 'blob-5', label: 'Interactive\nDesign', size: 'small', x: '65%', y: '25%', animDuration: 7.5, animDelay: 1.5 },
  { id: 'blob-6', label: 'Visualization\nDashboard', size: 'small', x: '35%', y: '50%', animDuration: 8.5, animDelay: 2.5 },
  { id: 'blob-7', label: 'Industrial\nDesign', size: 'small', x: '75%', y: '40%', animDuration: 6.5, animDelay: 1.2 },
  { id: 'blob-8', label: 'Modeling\n&\nPrediction', size: 'small', x: '5%', y: '30%', animDuration: 7, animDelay: 0.8 },
  { id: 'blob-9', label: 'AI\nApplication', size: 'small', x: '30%', y: '75%', animDuration: 8, animDelay: 1.8 },
];

const DEFAULT_HOME_CONTENT: PortfolioHomeContent = {
  badge: 'Portfolio Template',
  title: 'Design × Research × Development',
  intro: [
    'Hello! Welcome to this portfolio template. Replace this text in portfolioRoutes.json with your own introduction.',
    'This template supports multiple route configurations, bilingual content (Chinese/English), and customizable project categories.',
  ],
  blobs: DEFAULT_BLOBS,
};

const DEFAULT_FOOTER_CONTENT: PortfolioFooterContent = {
  title: 'Your Name',
  message: 'Thank you for reading. Feel free to reach out!',
  email: 'your.email@example.com',
};

const normalizeHomeIntro = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : value.split(/\n+/);
  return source
    .map((item) => item.replace(/\r/g, '').trim())
    .filter(Boolean);
};

const normaliseHomeContent = (
  config: PortfolioHomeConfig | undefined,
  fallback: PortfolioHomeContent,
  routeBlobs?: BlobConfig[],
): PortfolioHomeContent => {
  const badge = config?.badge?.trim() || fallback.badge;
  const title = config?.title?.trim() || fallback.title;
  const intro = normalizeHomeIntro(config?.intro);
  // Priority: home.blobs > route.blobs > fallback.blobs
  const blobs = (config?.blobs && config.blobs.length > 0)
    ? config.blobs
    : (routeBlobs && routeBlobs.length > 0)
      ? routeBlobs
      : fallback.blobs;
  return {
    badge,
    title,
    intro: intro.length ? intro : fallback.intro,
    blobs,
  };
};

const normaliseFooterContent = (
  config: PortfolioFooterConfig | undefined,
  fallback: PortfolioFooterContent,
): PortfolioFooterContent => {
  const title = config?.title?.trim() || fallback.title;
  const message = config?.message?.trim() || fallback.message;
  const email = config?.email?.trim() || fallback.email;
  return {
    title,
    message,
    email,
  };
};

const buildCategories = (
  source: Record<string, PortfolioCode[]> | undefined,
): PortfolioCategory[] => {
  if (!source) {
    return [];
  }

  const normalized = new Map(
    defaultCodes.map((code) => [code.toLowerCase(), code]),
  );

  const globalSeen = new Set<string>();
  const result: PortfolioCategory[] = [];

  Object.entries(source).forEach(([categoryName, codes = []]) => {
    if (!Array.isArray(codes)) {
      return;
    }

    const items: PortfolioItem[] = [];
    codes.forEach((rawCode) => {
      const lookupKey = rawCode.trim().toLowerCase();
      const resolved = normalized.get(lookupKey);
      if (!resolved || globalSeen.has(resolved)) {
        return;
      }
      const name = getPortfolioName(resolved);
      if (!name) {
        return;
      }
      const detail = workDetailMap[resolved] ?? createFallbackDetail(name);
      globalSeen.add(resolved);
      items.push({
        code: resolved,
        name,
        category: categoryName,
        detail,
      });
    });

    if (items.length) {
      result.push({ name: categoryName, items });
    }
  });

  return result;
};

const normaliseCvRoute = (
  config: CvRouteValue | undefined,
): { asset?: string; link?: string; groups?: string[] } => {
  if (!config) {
    return {};
  }
  if (typeof config === 'string') {
    return { asset: config.trim() || undefined };
  }
  const asset = config.asset?.trim() || undefined;
  const link = config.link?.trim() || undefined;
  const sourceGroups = Array.isArray(config.showGroups)
    ? config.showGroups
    : Array.isArray(config.showTypes)
      ? config.showTypes
      : undefined;
  const groups = sourceGroups
    ? Array.from(
      new Set(
        sourceGroups
          .map((item) => item?.trim())
          .filter((item): item is string => Boolean(item)),
      ),
    )
    : undefined;
  return { asset, link, groups };
};

const normaliseGroupList = (groups?: string[] | null): string[] | null => {
  if (!groups || groups.length === 0) {
    return null;
  }
  const cleaned = groups
    .map((group) => group?.trim())
    .filter((group): group is string => Boolean(group));
  if (!cleaned.length) {
    return null;
  }
  return Array.from(new Set(cleaned));
};

export const usePortfolioData = (routeKey: string) => {
  const currentEntry = useMemo<PortfolioRouteEntry>(
    () => ROUTE_CONFIG[routeKey] ?? {},
    [routeKey],
  );
  const defaultCvConfig = useMemo(
    () => normaliseCvRoute(DEFAULT_ROUTE_ENTRY.cv),
    [],
  );

  const categories = useMemo<PortfolioCategory[]>(() => {
    let resolvedCategories = buildCategories(currentEntry.categories);

    if (!resolvedCategories.length && currentEntry !== DEFAULT_ROUTE_ENTRY) {
      resolvedCategories = buildCategories(DEFAULT_ROUTE_ENTRY.categories);
    }

    if (!resolvedCategories.length) {
      const fallbackItems = defaultCodes
        .map((code) => {
          const name = getPortfolioName(code);
          if (!name) {
            return null;
          }
          return {
            code,
            name,
            category: '作品集',
          };
        })
        .filter((item): item is PortfolioItem => item !== null);

      return fallbackItems.length
        ? [
          {
            name: '作品集',
            items: fallbackItems.map((item) => ({
              ...item,
              detail: workDetailMap[item.code] ?? createFallbackDetail(item.name),
            })),
          },
        ]
        : [];
    }

    // Force "其他作品專案" to be the last category if it exists
    const SPECIAL_CATEGORY_NAME = '其他作品專案';
    const specialIndex = resolvedCategories.findIndex(c => c.name === SPECIAL_CATEGORY_NAME);
    if (specialIndex > -1 && specialIndex !== resolvedCategories.length - 1) {
      const [special] = resolvedCategories.splice(specialIndex, 1);
      resolvedCategories.push(special);
    }

    return resolvedCategories;
  }, [currentEntry]);

  const categoriesWithMatrix = useMemo<PortfolioCategoryWithMatrix[]>(
    () =>
      categories.map((category) => ({
        ...category,
        itemsMap: category.items.reduce<Record<string, PortfolioItem>>(
          (acc, item) => {
            acc[item.code] = item;
            return acc;
          },
          {},
        ),
      })),
    [categories],
  );

  const portfolioItems = useMemo(() => {
    const seen = new Set<string>();
    return categoriesWithMatrix
      .flatMap((category) => category.items)
      .filter((item) => {
        if (seen.has(item.code)) {
          return false;
        }
        seen.add(item.code);
        return true;
      });
  }, [categoriesWithMatrix]);

  const getYearRangeText = useCallback((detail: WorkDetail): string => {
    const start = (detail.yearBegin || '').trim();
    const end = (detail.yearEnd || '').trim();
    if (start && end && start !== end) {
      return `${start} – ${end}`;
    }
    return start || end || '';
  }, []);

  const cvSettings = useMemo<CvSettings>(() => {
    const currentConfig = normaliseCvRoute(currentEntry.cv);

    const resolvedAssetKey =
      currentConfig.asset ??
      defaultCvConfig.asset ??
      (typeof DEFAULT_ROUTE_ENTRY.cv === 'string'
        ? DEFAULT_ROUTE_ENTRY.cv
        : undefined);

    const downloadUrl =
      resolvedAssetKey && CV_ASSETS[resolvedAssetKey]
        ? CV_ASSETS[resolvedAssetKey]
        : null;

    const resolvedLink =
      currentConfig.link ?? defaultCvConfig.link ?? null;

    const resolvedGroups =
      normaliseGroupList(currentConfig.groups) ??
      normaliseGroupList(defaultCvConfig.groups) ??
      null;

    return {
      downloadUrl,
      link: resolvedLink,
      groups: resolvedGroups,
    };
  }, [currentEntry, defaultCvConfig]);

  const defaultHomeContent = useMemo(
    () => normaliseHomeContent(DEFAULT_ROUTE_ENTRY.home, DEFAULT_HOME_CONTENT, DEFAULT_ROUTE_ENTRY.blobs),
    [],
  );

  const homeContent = useMemo(
    () => normaliseHomeContent(currentEntry.home, defaultHomeContent, currentEntry.blobs),
    [currentEntry.home, currentEntry.blobs, defaultHomeContent],
  );

  const defaultFooterContent = useMemo(
    () => normaliseFooterContent(DEFAULT_ROUTE_ENTRY.footer, DEFAULT_FOOTER_CONTENT),
    [],
  );

  const footerContent = useMemo(
    () => normaliseFooterContent(currentEntry.footer, defaultFooterContent),
    [currentEntry.footer, defaultFooterContent],
  );

  const lang = currentEntry.lang || 'zh';
  const siteTitle = lang === 'en'
    ? (currentEntry.siteTitleEn?.trim() || currentEntry.siteTitle?.trim() || DEFAULT_ROUTE_ENTRY.siteTitle?.trim() || 'Portfolio')
    : (currentEntry.siteTitle?.trim() || DEFAULT_ROUTE_ENTRY.siteTitle?.trim() || 'Portfolio');
  const sidebarTitle = lang === 'en'
    ? (currentEntry.sidebarTitleEn?.trim() || currentEntry.sidebarTitle?.trim() || DEFAULT_ROUTE_ENTRY.sidebarTitle?.trim() || 'YOUR NAME')
    : (currentEntry.sidebarTitle?.trim() || DEFAULT_ROUTE_ENTRY.sidebarTitle?.trim() || 'YOUR NAME');
  const cvSummary = Array.isArray(currentEntry.cvSummary)
    ? currentEntry.cvSummary
    : Array.isArray(DEFAULT_ROUTE_ENTRY.cvSummary)
      ? DEFAULT_ROUTE_ENTRY.cvSummary
      : null;

  const routeSkills: SkillGroupData[] | null = useMemo(() => {
    if (Array.isArray(currentEntry.skills) && currentEntry.skills.length > 0) {
      return currentEntry.skills;
    }
    return null;
  }, [currentEntry.skills]);



  return {
    categories,
    categoriesWithMatrix,
    portfolioItems,
    workDetailMap,
    workImageMap: WORK_IMAGE_MAP,
    getYearRangeText,
    cvSettings,
    homeContent,
    footerContent,
    siteTitle,
    sidebarTitle,
    cvSummary,
    routeSkills,
    lang,
  };
};
