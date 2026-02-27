import { useMemo } from 'react';
import publishData from '../work_list/publishData.json';
import { PublicationGroup, PublicationItem } from '../types/portfolio';

type PublishDataFile = {
  groups?: Array<{
    title?: string;
    items?: Array<{
      title?: string;
      type?: string;
      description?: string;
      link?: string | null;
      relatedWorks?: string[];
    }>;
  }>;
};

const fileData = publishData as PublishDataFile;

const normalisePublishGroups = (): PublicationGroup[] => {
  const groups = Array.isArray(fileData.groups) ? fileData.groups : [];
  return groups.reduce<PublicationGroup[]>((acc, group) => {
    const title = group?.title?.trim();
    if (!title) {
      return acc;
    }

    const items = Array.isArray(group.items)
      ? group.items.reduce<PublicationItem[]>((list, item) => {
          if (!item) {
            return list;
          }
          const rawTitle = item.title?.trim();
          const rawType = item.type?.trim();
          const rawDescription = item.description?.trim();
          const rawLink = item.link?.trim();
          const related = Array.isArray(item.relatedWorks)
            ? item.relatedWorks.filter(
                (code): code is string => Boolean(code && code.trim()),
              )
            : [];

          const description = rawDescription || '';
          if (!rawTitle && !description) {
            return list;
          }

          const resolvedTitle =
            rawTitle || (description ? description.slice(0, 100) : '');

          const publicationItem: PublicationItem = {
            title: resolvedTitle,
            type: rawType || '',
            description,
            relatedWorks: related,
            ...(rawLink ? { link: rawLink } : {}),
          };

          list.push(publicationItem);
          return list;
        }, [])
      : [];

    if (!items.length) {
      return acc;
    }

    acc.push({ title, items });
    return acc;
  }, []);
};

const PUBLISH_GROUPS = normalisePublishGroups();

export const usePublishData = (): PublicationGroup[] => {
  return useMemo(() => PUBLISH_GROUPS, []);
};
