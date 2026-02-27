import { useMemo } from 'react';
import rawSkills from '../work_list/skillsData.json';
import { SkillGroup, SkillGroupData } from '../types/portfolio';

type SkillDataFile = {
  groups?: Array<{
    title?: string;
    categories?: Array<{
      name?: string;
      tools?: Array<{
        name?: string;
        description?: string;
        image?: string;
      }>;
    }>;
  }>;
};

const skillData = rawSkills as SkillDataFile;

const normaliseSkillGroups = (rawGroups?: SkillDataFile['groups']): SkillGroup[] => {
  const groups = Array.isArray(rawGroups) ? rawGroups : [];
  return groups
    .map((group) => {
      const title = group.title?.trim();
      if (!title) {
        return null;
      }
      const categories = Array.isArray(group.categories)
        ? group.categories
          .map((category) => {
            const name = category.name?.trim();
            if (!name) {
              return null;
            }
            const tools = Array.isArray(category.tools)
              ? category.tools
                .map((tool) => {
                  const toolName = tool.name?.trim();
                  if (!toolName) {
                    return null;
                  }
                  const description = tool.description?.trim();
                  const image = tool.image?.trim();
                  const result: { name: string; description?: string; image?: string } = {
                    name: toolName,
                  };
                  if (description) {
                    result.description = description;
                  }
                  if (image) {
                    result.image = image;
                  }
                  return result;
                })
                .filter(
                  (
                    tool,
                  ): tool is { name: string; description?: string; image?: string } =>
                    tool !== null,
                )
              : [];
            if (!tools.length) {
              return null;
            }
            return { name, tools };
          })
          .filter((category): category is { name: string; tools: { name: string; description?: string }[] } => category !== null)
        : [];
      if (!categories.length) {
        return null;
      }
      return { title, categories };
    })
    .filter((group): group is SkillGroup => group !== null);
};

const SKILL_GROUPS = normaliseSkillGroups(skillData.groups);

/**
 * Returns normalised skill groups.
 * If `overrideSkills` is provided (from per-route data in portfolioRoutes.json),
 * it will be used instead of the global skillsData.json.
 */
export const useSkillData = (overrideSkills?: SkillGroupData[] | null): SkillGroup[] => {
  return useMemo(() => {
    if (overrideSkills && overrideSkills.length > 0) {
      // Convert SkillGroupData[] to the normalised format
      return normaliseSkillGroups(
        overrideSkills.map((g) => ({
          title: g.title,
          categories: g.categories?.map((c) => ({
            name: c.name,
            tools: c.tools,
          })),
        })),
      );
    }
    return SKILL_GROUPS;
  }, [overrideSkills]);
};
