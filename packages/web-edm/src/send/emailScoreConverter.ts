import { EmailContentPayload } from './validator/validator-context';

function decodeEntities(encodedString: string) {
  var textArea = document.createElement('textarea');
  textArea.innerHTML = encodedString;
  return textArea.value;
}

const converter = (detail: any, runCheck?: (param: EmailContentPayload) => void) => {
  const spamAssassinData = Object.values(detail?.spamAssassin?.rules || {})
    .filter((item: any) => item.score < 0)
    .map((item: any) => ({
      description: decodeEntities(item.description).replaceAll('<br/>', ' '),
      mark: item.score,
    }));

  // SpamAssassin 垃圾邮件评定，mark小于需要展示扣分列表
  const spamAssassin = {
    name: `SpamAssassin 垃圾邮件评定`,
    list: spamAssassinData,
    mark: detail?.spamAssassin?.mark || 0,
  };

  // 发件IP黑名单
  const blacklistsData =
    detail?.blacklists?.blacklists
      ?.filter((item: any) => item.statusCode !== 0)
      ?.map((item: any) => ({
        description: `${item.name} ${item.url}`,
        mark: -0.5,
      })) || [];

  const blacklists = {
    name: `你的发件IP在${blacklistsData.length}个黑名单中`,
    list: blacklistsData,
    mark: blacklistsData.length * -0.5,
  };

  // 坏链检测
  const linksData =
    detail?.links?.urls?.map((item: any) => ({
      description: item.baseUrl,
      mark: -0.5,
    })) || [];

  const links = {
    name: `你的邮件中含有${linksData.length || 0}个坏链`,
    list: linksData,
    mark: linksData.length * -0.5,
  };

  const totalScore = 10;

  const score = totalScore + spamAssassin.mark + blacklists.mark + links.mark;

  spamAssassin.mark = spamAssassin.mark.toFixed(2);
  blacklists.mark = blacklists.mark.toFixed(2);
  links.mark = links.mark.toFixed(2);

  // List 固定只有3条
  const list = [spamAssassin, blacklists, links];

  list.sort((a, b) => a?.mark - b?.mark);
  spamAssassinData.sort((a, b) => a?.mark - b?.mark);
  blacklistsData.sort((a, b) => a?.mark - b?.mark);
  linksData.sort((a, b) => a?.mark - b?.mark);

  // 同步到任务检测
  if (runCheck) {
    runCheck({
      badLinks: {
        id: 'badLinks',
        validate() {
          return {
            count: linksData.length || 0,
            data: linksData,
          };
        },
      },
      spamAssassin: {
        id: 'spamAssassin',
        validate() {
          return {
            score: spamAssassin.mark,
            data: spamAssassin.list,
          };
        },
      },
    });
  }

  return {
    totalScore: totalScore.toFixed(2),
    score: score < 0 ? 0 : score.toFixed(2),
    title: detail.title,
    list,
  };
};

export default converter;
