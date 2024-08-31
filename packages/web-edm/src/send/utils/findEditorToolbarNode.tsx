import { getIn18Text } from 'api';
export const findToolbarBtn = (text: string) => {
  const nodes = document.querySelectorAll('.tox-toolbar__group[role=toolbar] .tox-tbtn.tox-tbtn--select');
  if (nodes) {
    return Array.from(nodes).find(node => node.innerHTML.includes(text));
  }
};

export const findToolbarBox = () => document.querySelector('.tox-toolbar.tox-toolbar--scrolling');

export const addLimitedTimeFree = (text: string) => {
  const node = findToolbarBtn(text);
  if (node) {
    node.insertAdjacentHTML('beforeend', getIn18Text('<div st'));
  }
};

export const addLimitedTimeFreeForBtn = () => {
  addLimitedTimeFree(getIn18Text('AIWRITE'));
  addLimitedTimeFree(getIn18Text('AIRETOUCH'));
};
