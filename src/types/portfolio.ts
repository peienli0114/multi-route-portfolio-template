export type ContentKey = 'home' | 'cv' | 'portfolio';

export type PortfolioCode = string;

export type WorkDetail = {
  fullName?: string;
  h2Name?: string;
  tableName?: string;
  yearBegin?: string;
  yearEnd?: string;
  intro?: string;
  introList?: string[];
  headPic?: string;
  tags?: string[];
  links?: Array<{ name?: string; link?: string }>;
  coWorkers?: Array<{ name?: string; work?: string; link?: string }>;
  content?: string;
  // English fields
  fullNameEn?: string;
  h2NameEn?: string;
  tableNameEn?: string;
  introEn?: string;
  introListEn?: string[];
  tagsEn?: string[];
};

export type PortfolioItem = {
  code: PortfolioCode;
  name: string;
  category: string;
  detail: WorkDetail;
};

export type PortfolioCategory = {
  name: string;
  items: PortfolioItem[];
};

export type PortfolioCategoryWithMatrix = PortfolioCategory & {
  itemsMap: Record<string, PortfolioItem>;
};

export type CvRouteValue =
  | string
  | {
    asset?: string;
    link?: string;
    showTypes?: string[];
    showGroups?: string[];
  };

export type CvSettings = {
  downloadUrl: string | null;
  link: string | null;
  groups: string[] | null;
};

export type BlobConfig = {
  id: string;
  label: string;
  size: 'large' | 'small';
  /** CSS percentage position relative to blob-container */
  x: string;
  y: string;
  /** CSS percentage width; defaults are 40% for large, 12% for small */
  width?: string;
  /** Radial gradient center color (large blobs only) */
  color?: string;
  /** Animation duration in seconds */
  animDuration?: number;
  /** Animation delay in seconds */
  animDelay?: number;
};

export type PortfolioHomeConfig = {
  badge?: string;
  title?: string;
  intro?: string | string[];
  blobs?: BlobConfig[];
};

export type PortfolioHomeContent = {
  badge: string;
  title: string;
  intro: string[];
  blobs: BlobConfig[];
};

export type PortfolioFooterConfig = {
  title?: string;
  message?: string;
  email?: string;
};

export type PortfolioFooterContent = {
  title: string;
  message: string;
  email: string;
};

export type SkillGroupData = {
  title: string;
  categories: {
    name: string;
    tools: {
      name: string;
      description?: string;
      image?: string;
    }[];
  }[];
};

export type PortfolioRouteEntry = {
  siteTitle?: string;
  sidebarTitle?: string;
  siteTitleEn?: string;
  sidebarTitleEn?: string;
  lang?: 'zh' | 'en';
  cv?: CvRouteValue;
  categories?: Record<string, PortfolioCode[]>;
  home?: PortfolioHomeConfig;
  blobs?: BlobConfig[];
  footer?: PortfolioFooterConfig;
  cvSummary?: Array<string | string[]>;
  skills?: SkillGroupData[];
};

export type PortfolioRouteConfig = Record<string, PortfolioRouteEntry>;

export type WorkGalleryItem = {
  type: 'image' | 'pdf';
  src: string;
};

export type WorkImages = {
  main: string | null;
  gallery: WorkGalleryItem[];
  videos: string[];
};

export type ExperienceEntry = {
  type: string;
  organisation: string;
  role: string;
  begin: string;
  end: string;
  relatedWorks: string[];
  description: string;
  showDefault: boolean;
  showGroups: string[];
  tags?: string[];
};

export type SkillTool = {
  name: string;
  description?: string;
  image?: string;
};

export type SkillCategory = {
  name: string;
  tools: SkillTool[];
};

export type SkillGroup = {
  title: string;
  categories: SkillCategory[];
};

export type PublicationItem = {
  title: string;
  type: string;
  description: string;
  link?: string | null;
  relatedWorks: string[];
};

export type PublicationGroup = {
  title: string;
  items: PublicationItem[];
};

export type ExperienceDataset = {
  typeOrder: string[];
  entries: ExperienceEntry[];
};

export type ExperienceGroup = {
  type: string;
  items: ExperienceEntry[];
};
