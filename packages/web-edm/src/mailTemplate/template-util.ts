let templateContent = '';
let templateId = '';

export const setTemplateContent = (content: string, id = ''): void => {
  templateContent = content;
  templateId = id;
};

export interface TemplateInfo {
  templateContent?: string;
  templateId?: string;
}

export const getTemplateContent = (needId?: boolean): TemplateInfo | string => {
  if (needId) {
    return {
      templateContent,
      templateId,
    };
  }
  return templateContent;
};
