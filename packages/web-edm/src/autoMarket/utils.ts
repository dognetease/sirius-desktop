import { ruleEngine } from 'env_def';
import { navigate } from 'gatsby';
import { apiHolder } from 'api';
import { uniq } from 'lodash';

const systemApi = apiHolder.api.getSystemApi();

/**
 *
 */
export const jumpToAutoMarketing = (url: string) => {
  if (!systemApi.isElectron()) {
    if (systemApi.isWebWmEntry()) {
      systemApi.openNewWindow(ruleEngine(url, null));
    } else {
      systemApi.openNewWindow(url);
    }
  } else {
    // 外贸客户端和老web端
    navigate(url);
  }
};

export function getEdmEmailVars(content: string, emailSubjects: string[]) {
  const titleVars: string[] = [];
  const temp = document.createElement('html');
  temp.innerHTML = content;
  const ret: { [key: string]: number } = {};
  Array.from(temp.querySelectorAll('span.mce-lx-var'))
    .map((span: any) => span.textContent)
    .forEach(s => {
      if (s && s.length > 2) {
        if (s.startsWith('#{') && s.endsWith('}')) {
          ret[s.substring(2, s.length - 1)] = 1;
        }
      }
    });

  emailSubjects?.forEach(subject =>
    String(subject).replace(/#\{([^\},\s]+)\}/g, (_: string, $1) => {
      if (titleVars.indexOf($1) === -1) {
        titleVars.push($1);
      }
      return _;
    })
  );

  return uniq(Object.keys(ret).concat(titleVars)).join(',');
}

export function getUUID() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
