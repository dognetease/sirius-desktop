import React, { useRef, useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { apiHolder } from 'api';
import { fromEvent, merge } from 'rxjs';
import { mapTo, debounceTime, filter, map, tap, sample } from 'rxjs/operators';
import style from './chatItemGraphic.module.scss';
import { IMGModule } from '../../common/convertServerMsgV2';
import ImagePreview from '@web-common/components/UI/ImagePreview';
import { ERROR_FALLBACK } from '../../utils/im_team_util';
import { MessageFlagSending } from '../../common/icon/messageFlag';

const systemApi = apiHolder.api.getSystemApi();
const realStyle = classnames.bind(style);
export const MarkdownImg: React.FC<{ data: IMGModule }> = props => {
  const { data } = props;
  const domRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<'ing' | 'success' | 'fail'>('ing');
  const openLink = () => {
    if (data.action === 'URL') {
      systemApi.handleJumpUrl('' + new Date().getTime(), data.action_url.pc_url);
    } else if (data.action === 'VIEW') {
      ImagePreview.preview({
        data: [
          {
            previewUrl: data.img_url.origin,
            downloadUrl: data.img_url.origin,
            type: 'image',
            name: '',
            size: 100,
            ext: 'jpg',
            presetSize: [
              {
                url: data.img_url.origin,
                width: data.width,
                height: data.height,
              },
            ],
          },
        ],
        startIndex: 0,
      });
    }
  };

  const [tipCoords, setTipCoords] = useState([0, 0]);
  useEffect(() => {
    const $mouseEnter = fromEvent(domRef.current as HTMLDivElement, 'mouseenter').pipe(mapTo(true));
    const $mouseLeave = fromEvent(domRef.current as HTMLDivElement, 'mouseleave').pipe(mapTo(false));

    const $mouseMove = fromEvent(domRef.current as HTMLDivElement, 'mousemove');

    const $stay = merge($mouseEnter, $mouseLeave).pipe(
      tap(args => {
        console.log('[test]trigger', args);
      }),
      debounceTime(500)
    );
    const $visibleSub = $mouseMove
      .pipe(
        sample($stay.pipe(filter(val => val))),
        map(e => [e.offsetX, e.offsetY] as [number, number])
      )
      .subscribe(coords => {
        console.log('[test]trigger', coords);
        setTipCoords(coords);
      });

    const $hiddenSub = $mouseLeave.subscribe(() => {
      setTipCoords([0, 0]);
    });

    return () => {
      // setTipCoords();
      $visibleSub.unsubscribe();
      $hiddenSub.unsubscribe();
    };
  }, []);

  const onLoad = () => {
    setLoadState('success');
  };
  const onError = () => {
    setLoadState('fail');
  };

  return (
    <div
      className={realStyle('imgModuleWrapper')}
      style={{
        paddingBottom: `${(100 * data.height) / data.width}%`,
      }}
      ref={domRef}
    >
      <img
        src={data.img_url.thumb}
        className={realStyle({
          enableClick: data.action !== 'DISABLE',
          visible: loadState === 'success',
        })}
        onLoad={onLoad}
        onError={onError}
        alt={data.hover_tips}
        onClick={openLink}
      />

      {loadState !== 'success' && (
        <div className={realStyle('placeholderWrap')}>{loadState === 'ing' ? <MessageFlagSending /> : <img className={realStyle('failed')} src={ERROR_FALLBACK} />}</div>
      )}

      {tipCoords.join('-') === '0-0' ? null : (
        <span
          className={realStyle('graphicImgTips')}
          style={{
            left: `${tipCoords[0]}px`,
            top: `${tipCoords[1]}px`,
          }}
        >
          {data.hover_tips}
        </span>
      )}
    </div>
  );
};
