import React, { useRef, useEffect, useContext, useMemo } from 'react';
import classnames from 'classnames/bind';
import style from './line.module.scss';
import { Context } from '../store/currentIdClientProvider';

const realStyle = classnames.bind(style);

interface CurrentMsgLineApi {
  idClient: string;
  loadComplete?: boolean;
  toggleVisible?: (flag: boolean) => void;
  scrollIntoViewOption?: ScrollIntoViewOptions;
}

export type ScrollIntoViewOptions =
  | {
      behavior?: 'auto' | 'smooth';
      block: 'start' | 'center' | 'end' | 'nearest';
    }
  | boolean;
export const CurrentMsgLine: React.FC<CurrentMsgLineApi> = props => {
  const { idClient, loadComplete = false, toggleVisible = () => {}, scrollIntoViewOption = true } = props;
  const { currentIdClient } = useContext(Context);
  const lineRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (currentIdClient.indexOf(idClient) === -1) {
      return;
    }
    const lineNode = lineRef.current as unknown as HTMLParagraphElement;

    const $tHandles: any[] = [];
    [0, 300, 800].forEach(time => {
      const $t = setTimeout(() => {
        if ('scrollIntoViewIfNeeded' in document.body) {
          lineNode.scrollIntoViewIfNeeded(scrollIntoViewOption);
        } else {
          lineNode.scrollIntoView(scrollIntoViewOption);
        }
      }, time);
      toggleVisible(true);
      $tHandles.push($t);
    });
    return () => {
      $tHandles.forEach($t => {
        clearTimeout($t);
      });
    };
  }, [currentIdClient, loadComplete]);

  if (currentIdClient.indexOf(idClient) !== -1) {
    return (
      <p
        ref={lineRef}
        data-watchonce="true"
        className={realStyle('currentMsgLineMark', {
          highlight: /high$/.test(currentIdClient),
        })}
      />
    );
  }
  return null;
};
