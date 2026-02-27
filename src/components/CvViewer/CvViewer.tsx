import React, { useState, useMemo } from 'react';
import {
  CvSettings,
  ExperienceGroup,
  PortfolioCode,
  WorkDetail,
  SkillGroupData,
} from '../../types/portfolio';
import { useSkillData } from '../../hooks/useSkillData';
import { usePublishData } from '../../hooks/usePublishData';
// ▶ Place your CV portrait photo at src/asset/cv/me.png
// If you don't have one, the photo section will simply be hidden.
const loadCvPhoto = (): string | undefined => {
  try {
    const context = (require as any).context('../../asset/cv', false, /me\.png$/i);
    const keys: string[] = context.keys();
    return keys.length > 0 ? (context(keys[0]) as string) : undefined;
  } catch {
    return undefined;
  }
};
const CvPhoto = loadCvPhoto();

const loadCertificateAssets = () => {
  try {
    return require.context(
      '../../asset/certificates',
      false,
      /\.(png|jpe?g|gif|webp|pdf)$/i,
    );
  } catch {
    return null;
  }
};

const CERTIFICATE_CONTEXT = loadCertificateAssets();

const CERTIFICATE_IMAGE_MAP: Record<string, string> = (() => {
  if (!CERTIFICATE_CONTEXT) {
    return {};
  }
  return CERTIFICATE_CONTEXT.keys().reduce<Record<string, string>>(
    (map, key) => {
      const normalized = key.replace('./', '').toLowerCase();
      try {
        map[normalized] = CERTIFICATE_CONTEXT(key) as string;
      } catch {
        // ignore
      }
      return map;
    },
    {},
  );
})();

type ContactLink = {
  label: string;
  href: string;
  ariaLabel?: string;
};

const BASE_CONTACT_LINKS: ContactLink[] = [
  // ▶ Add your contact links here. Examples:
  // {
  //   label: 'Email',
  //   href: 'mailto:your.email@example.com',
  //   ariaLabel: 'Email: your.email@example.com',
  // },
  // {
  //   label: 'LinkedIn',
  //   href: 'https://www.linkedin.com/in/your-profile',
  //   ariaLabel: 'LinkedIn profile',
  // },
  // {
  //   label: 'GitHub',
  //   href: 'https://github.com/your-username',
  //   ariaLabel: 'GitHub profile',
  // },
];

type CvViewerProps = {
  settings: CvSettings;
  experienceGroups: ExperienceGroup[];
  workDetailMap: Record<string, WorkDetail>;
  summaryBlocks?: Array<string | string[]> | null;
  onNavigateToWork?: (code: PortfolioCode) => void;
  routeSkills?: SkillGroupData[] | null;
};

const splitDescription = (content: string): string[] =>
  content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const normaliseYear = (value: number): number => {
  if (value < 100 && value > 0) {
    return value >= 50 ? 1900 + value : 2000 + value;
  }
  return value;
};

const extractYear = (token: string): number | null => {
  if (!token) {
    return null;
  }
  const numeric = Number(token);
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (numeric >= 100) {
    return normaliseYear(numeric);
  }
  if (numeric >= 10 && numeric <= 30) {
    return normaliseYear(numeric);
  }
  if (token.length >= 3) {
    return normaliseYear(numeric);
  }
  return null;
};

const parseDateParts = (
  raw: string,
): { year: number; month: number | null } | null => {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed
    .replace(/年/g, '/')
    .replace(/月/g, '')
    .replace(/\./g, '/')
    .replace(/-/g, '/');
  const tokens = cleaned.split(/[/\s]+/).filter(Boolean);
  if (!tokens.length) {
    return null;
  }

  let year: number | null = null;
  let month: number | null = null;

  tokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (month === null && MONTH_MAP[lower]) {
      month = MONTH_MAP[lower];
      return;
    }
    if (year === null) {
      const potentialYear = extractYear(token);
      if (potentialYear !== null) {
        year = potentialYear;
        return;
      }
    }
    const numeric = Number(token);
    if (
      Number.isNaN(numeric) ||
      month !== null ||
      numeric < 1 ||
      numeric > 12
    ) {
      return;
    }
    month = numeric;
  });

  if (year === null) {
    const fallbackToken = tokens.find(
      (token) => extractYear(token) !== null,
    );
    if (fallbackToken) {
      const extractedFallback = extractYear(fallbackToken);
      if (extractedFallback !== null) {
        year = extractedFallback;
      }
    }
  }

  if (month === null) {
    const monthToken = tokens.find((token) =>
      Boolean(MONTH_MAP[token.toLowerCase()]),
    );
    if (monthToken) {
      month = MONTH_MAP[monthToken.toLowerCase()];
    }
  }

  if (year === null) {
    return null;
  }

  return {
    year,
    month: month ? Math.min(Math.max(month, 1), 12) : null,
  };
};

const formatDate = (value: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '';
  }
  if (/^present$/i.test(trimmed)) {
    return 'Present';
  }
  const parsed = parseDateParts(trimmed);
  if (!parsed) {
    return trimmed;
  }
  const { year, month } = parsed;
  if (month) {
    return `${year}/${month.toString().padStart(2, '0')}`;
  }
  return `${year}`;
};

const formatRange = (begin: string, end: string): string => {
  const beginFormatted = formatDate(begin);
  const endFormatted = formatDate(end);

  const hasBegin = Boolean(beginFormatted);
  const hasEnd = Boolean(endFormatted);

  if (hasBegin && hasEnd && endFormatted !== 'Present') {
    if (beginFormatted === endFormatted) {
      return beginFormatted;
    }
    return `${beginFormatted} – ${endFormatted}`;
  }

  if (hasBegin) {
    const resolvedEnd = hasEnd ? endFormatted : 'Present';
    return `${beginFormatted} – ${resolvedEnd}`;
  }

  return hasEnd ? endFormatted : '';
};

const computeDuration = (begin: string, end: string): string | null => {
  const startParsed = parseDateParts(begin);
  if (!startParsed) {
    return null;
  }

  const endTrimmed = end?.trim();
  const isPresent = endTrimmed ? /^present$/i.test(endTrimmed) : true;
  const endParsed = isPresent ? null : parseDateParts(endTrimmed ?? '');

  const startYear = startParsed.year;
  const startMonth = startParsed.month ?? 1;

  const now = new Date();
  const endYear = endParsed ? endParsed.year : now.getFullYear();
  const endMonth = endParsed ? endParsed.month ?? 12 : now.getMonth() + 1;

  const startTotalMonths = startYear * 12 + (startMonth - 1);
  const endTotalMonths = endYear * 12 + (endMonth - 1);

  if (Number.isNaN(startTotalMonths) || Number.isNaN(endTotalMonths)) {
    return null;
  }
  const diff = endTotalMonths - startTotalMonths;
  if (diff < 0) {
    return null;
  }

  const years = Math.floor(diff / 12);
  const months = diff % 12;

  if (years === 0) {
    return `${months.toString().padStart(2, '0')}m`;
  }
  return `${years}y${months.toString().padStart(2, '0')}m`;
};

const resolveSkillAsset = (
  path: string,
): { src: string; type: 'image' | 'pdf' } | null => {
  if (!path) {
    return null;
  }
  const extensionMatch = path.match(/\.([a-z0-9]+)$/i);
  const ext = extensionMatch ? extensionMatch[1].toLowerCase() : '';
  const assetType: 'image' | 'pdf' = ext === 'pdf' ? 'pdf' : 'image';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { src: path, type: assetType };
  }
  const normalized = path.replace(/^\.?\//, '').toLowerCase();
  const resolved = CERTIFICATE_IMAGE_MAP[normalized];
  if (resolved) {
    return { src: resolved, type: assetType };
  }
  return null;
};

const CvViewer: React.FC<CvViewerProps> = ({
  settings,
  experienceGroups,
  workDetailMap,
  summaryBlocks,
  onNavigateToWork,
  routeSkills,
}) => {
  const renderInlineStrong = (text: string, keyPrefix: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*{1,2})([^*]+?)\1/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let counter = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`${keyPrefix}-strong-${counter}`}>{match[2]}</strong>,
      );
      lastIndex = regex.lastIndex;
      counter += 1;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length ? parts : text;
  };

  const skillGroups = useSkillData(routeSkills);
  const publishGroups = usePublishData();
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [isCvExpanded, setIsCvExpanded] = useState(false);
  const [skillPreview, setSkillPreview] = useState<
    { name: string; source: string; type: 'image' | 'pdf' } | null
  >(null);
  const contactLinks: ContactLink[] = [
    ...(settings.link
      ? [
        {
          label: 'PDF',
          href: settings.link,
          ariaLabel: '下載履歷 PDF',
        },
      ]
      : []),
    ...BASE_CONTACT_LINKS,
  ];

  const cvSummaryNodes = useMemo(() => {
    if (!summaryBlocks || summaryBlocks.length === 0) {
      return [];
    }
    return summaryBlocks
      .map((block, index) => {
        if (Array.isArray(block)) {
          const items = block
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean);
          if (!items.length) {
            return null;
          }
          return (
            <ul className="cv-summary-list" key={`summary-list-${index}`}>
              {items.map((item, idx) => (
                <li className="cv-summary-list-item" key={`summary-item-${index}-${idx}`}>
                  {renderInlineStrong(item, `summary-${index}-${idx}`)}
                </li>
              ))}
            </ul>
          );
        }
        if (typeof block === 'string' && block.trim()) {
          return (
            <div className="cv-summary-block" key={`summary-block-${index}`}>
              {renderInlineStrong(block.trim(), `summary-block-${index}`)}
            </div>
          );
        }
        return null;
      })
      .filter((node): node is React.ReactElement => Boolean(node));
  }, [summaryBlocks]);

  type PublishEntryRow = {
    text: string;
    type: string;
    link: string | null;
  };

  type PublishBucketRow = {
    code: string | null;
    workName: string | null;
    entries: PublishEntryRow[];
  };

  type PublishCategoryRow = {
    title: string;
    tags: string[];
    totalRows: number;
    buckets: PublishBucketRow[];
  };

  const publishTableRows: PublishCategoryRow[] = publishGroups.reduce(
    (rows, group) => {
      if (!group.items.length) {
        return rows;
      }
      const rawTitle = group.title?.trim() || '';
      const normalizedTitle = rawTitle.replace(/\s+/g, ' ');
      const [mainTitleRaw, ...tagParts] = normalizedTitle.split(/\s*#\s*/);
      const mainTitle = mainTitleRaw?.trim() || '—';
      const tags = tagParts.map((tag) => tag.trim()).filter(Boolean);

      const bucketAccumulator: PublishBucketRow[] = [];

      group.items.forEach((item) => {
        const descriptionText = item.description?.trim();
        const titleText = item.title?.trim();
        const textContent = descriptionText || titleText;
        if (!textContent) {
          return;
        }
        const relatedCode = Array.isArray(item.relatedWorks)
          ? item.relatedWorks.find(
            (code) => typeof code === 'string' && Boolean(code && code.trim()),
          )
          : null;
        const primaryCode = relatedCode ? relatedCode.trim().toLowerCase() : null;
        let targetBucket = bucketAccumulator.find((bucket) => bucket.code === primaryCode);
        if (!targetBucket) {
          const detail =
            primaryCode && workDetailMap[primaryCode]
              ? workDetailMap[primaryCode]
              : null;
          const workName = primaryCode
            ? detail?.tableName || detail?.fullName || primaryCode.toUpperCase()
            : null;
          targetBucket = {
            code: primaryCode,
            workName,
            entries: [],
          };
          bucketAccumulator.push(targetBucket);
        }

        const entry: PublishEntryRow = {
          text: textContent,
          type: item.type?.trim() || '',
          link: item.link?.trim() || null,
        };
        targetBucket.entries.push(entry);
      });

      const buckets = bucketAccumulator
        .map((bucket) => ({
          ...bucket,
          entries: bucket.entries.filter((entry) => Boolean(entry.text)),
        }))
        .filter((bucket) => bucket.entries.length > 0);

      const totalRows = buckets.reduce((sum, bucket) => sum + bucket.entries.length, 0);

      if (!totalRows) {
        return rows;
      }

      rows.push({
        title: mainTitle,
        tags,
        totalRows,
        buckets,
      });
      return rows;
    },
    [] as PublishCategoryRow[],
  );

  const handleWorkClick = (code: string) => {
    if (onNavigateToWork) {
      onNavigateToWork(code);
    }
  };

  const openSkillProof = (toolName: string, assetPath: string) => {
    const asset = resolveSkillAsset(assetPath);
    if (!asset) {
      return;
    }
    setSkillPreview({ name: toolName, source: asset.src, type: asset.type });
  };

  const closeSkillProof = () => {
    setSkillPreview(null);
  };

  const openEntry = (key: string) => {
    setExpandedEntries((prev) => {
      if (prev[key]) {
        return prev;
      }
      return {
        ...prev,
        [key]: true,
      };
    });
  };

  const handleEntryClick = (
    event: React.MouseEvent<HTMLElement>,
    key: string,
    isExpandableEntry: boolean,
  ) => {
    if (!isExpandableEntry) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && target.closest('button, a')) {
      return;
    }
    openEntry(key);
  };

  const handleEntryKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    key: string,
    isExpandableEntry: boolean,
  ) => {
    if (!isExpandableEntry) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest('button, a')) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEntry(key);
    }
  };

  return (
    <section className={`cv-section${isCvExpanded ? ' is-expanded' : ''}`}>
      <header className="cv-header">
        <div className="cv-header-info">
          <h2 className="cv-title">YOUR NAME</h2>
          <div className="cv-contact">
            {contactLinks.map(({ label, href, ariaLabel }, index) => (
              <React.Fragment key={label}>
                <a
                  className="cv-contact-link"
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={ariaLabel || label}
                >
                  {label}
                </a>
                {index < contactLinks.length - 1 && <span className="cv-contact-separator">|</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="cv-header-summary">
            {cvSummaryNodes && cvSummaryNodes.length ? (
              cvSummaryNodes
            ) : (
              <>
                <div className="cv-header-description">
                  <strong>Key Experiences:</strong>
                  <ul>
                    <li>Configure your CV summary in portfolioRoutes.json → cvSummary</li>
                    <li>This fallback content only appears when no cvSummary is set</li>
                  </ul>
                </div>
                <p className="cv-header-description">
                  <strong>Key Skills:</strong>
                  <br />
                  Configure your skills in skillsData.json or via Admin GUI
                </p>
              </>
            )}
          </div>
        </div>
        <div className="cv-header-photo" aria-hidden="true">
          {CvPhoto && <img src={CvPhoto} alt="Portrait" />}
        </div>
      </header>
      <div className="cv-expand-toggle-wrapper">
        <button
          type="button"
          className="cv-expand-toggle"
          onClick={() => setIsCvExpanded((previous) => !previous)}
          aria-expanded={isCvExpanded}
        >
          {isCvExpanded ? '收合' : '　詳細經歷/技能　'}
        </button>
      </div>

      {isCvExpanded && (
        <>

          <div className="cv-experience">
            {experienceGroups.map((group, groupIndex) => (
              <section className="cv-experience-group" key={group.type}>
                <h3 className="cv-group-title">{group.type}</h3>
                <div className="cv-group-list">
                  {group.items.map((item, index) => {
                    const period = formatRange(item.begin, item.end);
                    const paragraphs = splitDescription(item.description);
                    const hasRelatedWorks =
                      Array.isArray(item.relatedWorks) && item.relatedWorks.length > 0;
                    // const tags = Array.isArray(item.tags)
                    //   ? item.tags.filter((tag) => Boolean(tag && tag.trim()))
                    //   : [];
                    const entryKey = `${group.type}-${index}`;
                    const sanitizedGroupKey = group.type
                      .replace(/\s+/g, '-')
                      .replace(/[^a-zA-Z0-9-_]/g, '')
                      .toLowerCase();
                    const entryId = `cv-entry-${sanitizedGroupKey || groupIndex}-${index}`;
                    const isExpandable = paragraphs.length > 0;
                    const isExpanded = isExpandable
                      ? Boolean(expandedEntries[entryKey])
                      : true;
                    const durationText = computeDuration(item.begin, item.end);

                    return (
                      <article
                        key={`${item.organisation}-${index}`}
                        className={`cv-entry${isExpandable ? ' is-expandable' : ''}${isExpanded ? ' is-expanded' : ''
                          }`}
                        onClick={(event) => handleEntryClick(event, entryKey, isExpandable)}
                        onKeyDown={(event) => handleEntryKeyDown(event, entryKey, isExpandable)}
                        role={isExpandable ? 'button' : undefined}
                        tabIndex={isExpandable ? 0 : undefined}
                        aria-expanded={isExpandable ? isExpanded : undefined}
                      >
                        <header className="cv-entry-header">
                          <div className="cv-entry-heading">
                            <h4 className="cv-entry-organisation">
                              {item.organisation}
                              {item.role && <><span className="cv-entry-separator"> | </span><span className="cv-entry-role">{item.role}</span></>}
                            </h4>
                            {hasRelatedWorks && (
                              <div className="cv-entry-related-inline">
                                <div className="cv-related-list">
                                  {item.relatedWorks.map((code) => {
                                    const detail = workDetailMap[code];
                                    const name =
                                      detail?.tableName ||
                                      detail?.fullName ||
                                      code.toUpperCase();
                                    return (
                                      <button
                                        key={code}
                                        type="button"
                                        className="cv-related-chip"
                                        onClick={() => handleWorkClick(code)}
                                      >
                                        {name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="cv-entry-period-block">
                            {period && (
                              <span className="cv-entry-period">

                                {durationText ? ` ${durationText} | ` : ''}
                                {period}
                              </span>
                            )}
                          </div>
                          <div className="cv-entry-header-actions">
                            {isExpandable ? (
                              <button
                                type="button"
                                className="cv-entry-toggle"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEntry(entryKey);
                                }}
                                aria-expanded={isExpanded}
                                aria-controls={`${entryId}-details`}
                                aria-label={isExpanded ? '已展開' : '展開詳情'}
                              >
                                <span className="cv-entry-toggle-icon" aria-hidden="true">
                                  {isExpanded ? '▾' : '▸'}
                                </span>
                              </button>
                            ) : (
                              <span className="cv-entry-toggle-spacer" aria-hidden="true" />
                            )}
                          </div>
                        </header>
                        {isExpandable && (
                          <div
                            className={`cv-entry-details${isExpanded ? ' is-expanded' : ''}`}
                            id={`${entryId}-details`}
                            aria-hidden={!isExpanded}
                          >
                            <div className="cv-entry-details-body">
                              <div className="cv-entry-description">
                                <ul>
                                  {paragraphs.map((paragraph, paragraphIndex) => (
                                    <li key={paragraphIndex}>{paragraph}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            {experienceGroups.length === 0 && (
              <p className="cv-empty">目前尚未提供履歷內容。</p>
            )}
          </div>

          {skillGroups.length > 0 && (
            <section className="cv-skills">
              <h3 className="cv-skills-title">Skill and Tool</h3>
              <div className="cv-skills-grid">
                {skillGroups.map((group) => (
                  <div className="cv-skill-column" key={group.title}>
                    <h4 className="cv-skill-group-title">{group.title}</h4>
                    <div className="cv-skill-category-list">
                      {group.categories.map((category) => (
                        <div className="cv-skill-category" key={category.name}>
                          <h5 className="cv-skill-category-name">{category.name}</h5>
                          <ul className="cv-skill-tool-list">
                            {category.tools.map((tool) => (
                              <li
                                className={`cv-skill-tool${tool.image ? ' has-proof' : ''}`}
                                key={tool.name}
                              >
                                <div className="cv-skill-tool-main">
                                  <span className="cv-skill-tool-name">{tool.name}</span>
                                  {tool.description && (
                                    <span className="cv-skill-tool-desc">{tool.description}</span>
                                  )}
                                </div>
                                {tool.image && (
                                  <button
                                    type="button"
                                    className="cv-skill-proof-button"
                                    onClick={() => openSkillProof(tool.name, tool.image!)}
                                  >
                                    證書
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {publishTableRows.length > 0 && (
            <section className="cv-publish">
              <h3 className="cv-publish-title">Awards / Publications / Exhibitions</h3>
              <div className="cv-publish-table-wrapper">
                <table className="cv-publish-table">
                  <colgroup>
                    <col className="cv-publish-col cv-publish-col--category" />
                    <col className="cv-publish-col cv-publish-col--type" />
                    <col className="cv-publish-col cv-publish-col--content" />
                    <col className="cv-publish-col cv-publish-col--work" />
                  </colgroup>
                  <tbody>
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      publishTableRows.forEach((category, categoryIndex) => {
                        let categoryRendered = false;
                        category.buckets.forEach((bucket, bucketIndex) => {
                          let workRendered = false;
                          bucket.entries.forEach((entry, entryIndex) => {
                            const isFirstCategoryRow = !categoryRendered;
                            const isFirstWorkRow = !workRendered;
                            rows.push(
                              <tr key={`publish-${categoryIndex}-${bucketIndex}-${entryIndex}`}>
                                {isFirstCategoryRow && (
                                  <td
                                    rowSpan={category.totalRows}
                                    className="cv-publish-cell--category"
                                  >
                                    <div className="cv-publish-category-cell">
                                      <span className="cv-publish-category-main">
                                        {category.title}
                                      </span>
                                      {category.tags.length > 0 && (
                                        <div className="cv-publish-category-tags">
                                          {category.tags.map((tag) => (
                                            <span className="cv-publish-category-tag" key={tag}>
                                              #{tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                )}
                                <td className="cv-publish-cell--type">
                                  {entry.type ? (
                                    <span className="cv-publish-item-type">#{entry.type}</span>
                                  ) : (
                                    <span className="cv-publish-work-placeholder">—</span>
                                  )}
                                </td>
                                <td className="cv-publish-cell--content">
                                  {entry.link ? (
                                    <a
                                      href={entry.link}
                                      className="cv-publish-item-text"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {entry.text}
                                    </a>
                                  ) : (
                                    <span className="cv-publish-item-text">{entry.text}</span>
                                  )}
                                </td>
                                {isFirstWorkRow && (
                                  <td rowSpan={bucket.entries.length} className="cv-publish-cell--work">
                                    {bucket.code ? (
                                      <button
                                        type="button"
                                        className="cv-publish-work-button"
                                        onClick={() => handleWorkClick(bucket.code as string)}
                                      >
                                        {bucket.workName ||
                                          (bucket.code ? bucket.code.toUpperCase() : '—')}
                                      </button>
                                    ) : (
                                      <span className="cv-publish-work-placeholder">
                                        {bucket.workName || '—'}
                                      </span>
                                    )}
                                  </td>
                                )}
                              </tr>,
                            );
                            if (isFirstCategoryRow) {
                              categoryRendered = true;
                            }
                            if (isFirstWorkRow) {
                              workRendered = true;
                            }
                          });
                        });
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="cv-publish-mobile" aria-hidden>
                {publishTableRows.map((category, categoryIndex) => (
                  <div className="cv-publish-mobile-category" key={`mobile-${categoryIndex}`}>
                    <div className="cv-publish-mobile-category-header">
                      <span className="cv-publish-mobile-category-title">{category.title}</span>
                      {category.tags.length > 0 && (
                        <div className="cv-publish-mobile-category-tags">
                          {category.tags.map((tag) => (
                            <span className="cv-publish-mobile-category-tag" key={tag}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {category.buckets.map((bucket, bucketIndex) => (
                      <div
                        className="cv-publish-mobile-work"
                        key={`mobile-${categoryIndex}-${bucketIndex}-${bucket.code ?? 'none'}`}
                      >
                        <ul className="cv-publish-mobile-entry-list">
                          {bucket.entries.map((entry, entryIndex) => (
                            <li
                              className="cv-publish-mobile-entry"
                              key={`mobile-entry-${categoryIndex}-${bucketIndex}-${entryIndex}`}
                            >
                              {entry.type ? (
                                <span className="cv-publish-item-type">#{entry.type}</span>
                              ) : null}
                              {entry.link ? (
                                <a
                                  href={entry.link}
                                  className="cv-publish-item-text"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {entry.text}
                                </a>
                              ) : (
                                <span className="cv-publish-item-text">{entry.text}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="cv-publish-mobile-work-footer">
                          {bucket.code ? (
                            <button
                              type="button"
                              className="cv-publish-work-button cv-publish-mobile-work-button"
                              onClick={() => handleWorkClick(bucket.code as string)}
                            >
                              {bucket.workName || (bucket.code ? bucket.code.toUpperCase() : '—')}
                            </button>
                          ) : (
                            <span className="cv-publish-work-placeholder">
                              {bucket.workName || '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {skillPreview && (
        <div className="cv-skill-proof-overlay" onClick={closeSkillProof}>
          <div
            className="cv-skill-proof-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="cv-skill-proof-close"
              onClick={closeSkillProof}
              aria-label="關閉證明"
            >
              ×
            </button>
            {skillPreview.type === 'pdf' ? (
              <object
                data={skillPreview.source}
                type="application/pdf"
                className="cv-skill-proof-media"
              >
                <iframe
                  src={skillPreview.source}
                  title={skillPreview.name}
                  className="cv-skill-proof-media"
                />
              </object>
            ) : (
              <img
                src={skillPreview.source}
                alt={`${skillPreview.name} 證明`}
                className="cv-skill-proof-media"
              />
            )}
            <p className="cv-skill-proof-caption">{skillPreview.name}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default CvViewer;
