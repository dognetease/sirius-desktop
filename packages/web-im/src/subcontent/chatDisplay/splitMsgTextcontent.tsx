interface TextContentApi {
  type: 'text' | 'emoji' | 'link' | 'apnText' | 'wrap';
  content: string;
}

export const lookupApnText: ReplaceCallback = str => {
  const reg = /@[^\s.@]+(?=([@\s]|$))/;
  const results: TextContentApi[] = [];
  while (str.length) {
    const matchArr = str.match(reg);

    if (!matchArr) {
      results.push({
        type: 'text',
        content: str,
      });
      str = '';
      continue;
    }
    const startIndex = matchArr.index as number;
    const result = matchArr[0] as string;
    if (startIndex > 0) {
      results.push({
        type: 'text',
        content: str.substr(0, startIndex),
      });
    }
    results.push({
      type: 'apnText',
      content: str.substr(startIndex, result.length),
    });
    str = str.substr(startIndex + result.length);
  }
  return results;
};

export const lookupLink: ReplaceCallback = str => {
  const reg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9():;%_\+.~#?&//=@,]*)/i;
  const results: TextContentApi[] = [];
  while (str.length) {
    const matchArr = str.match(reg);
    if (!matchArr) {
      results.push({
        type: 'text',
        content: str,
      });
      str = '';
      continue;
    }
    const startIndex = matchArr.index as number;
    const result = matchArr[0] as string;
    if (startIndex > 0) {
      results.push({
        type: 'text',
        content: str.substr(0, startIndex),
      });
    }
    results.push({
      type: 'link',
      content: str.substr(startIndex, result.length),
    });
    str = str.substr(startIndex + result.length);
  }
  return results;
};

export const lookupEmoji: ReplaceCallback = str => {
  const reg = /\[[\u4E00-\u9FA5\d\+\w]+\]/;
  const results: TextContentApi[] = [];
  while (str.length) {
    const matchArr = str.match(reg);

    if (!matchArr) {
      results.push({
        type: 'text',
        content: str,
      });
      str = '';
      continue;
    }
    const startIndex = matchArr.index as number;
    const result = matchArr[0] as string;
    if (startIndex > 0) {
      results.push({
        type: 'text',
        content: str.substr(0, startIndex),
      });
    }
    results.push({
      type: 'emoji',
      content: str.substr(startIndex, result.length),
    });
    str = str.substr(startIndex + result.length);
  }
  return results;
};

type ReplaceCallback = (str: string, ...args: any[]) => TextContentApi[];

export const matchTextContent = (contentList: TextContentApi[], callback: ReplaceCallback, ...args: any[]): TextContentApi[] => {
  let newContentList: TextContentApi[] = [];
  while (contentList.length) {
    const curContent = contentList.shift() as TextContentApi;
    if (curContent.type !== 'text') {
      newContentList.push(curContent);
      continue;
    }
    const results = callback(curContent.content, ...args);
    newContentList = [...newContentList, ...results];
  }

  return newContentList;
};
