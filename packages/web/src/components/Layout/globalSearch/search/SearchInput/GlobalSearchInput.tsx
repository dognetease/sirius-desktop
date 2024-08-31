import React, { useEffect, useRef, useState } from 'react';
import styles from './searchinput.module.scss';
import classNames from 'classnames';
import { useMeasure } from 'react-use';
// import LxTag from '@web-common/components/UI/Tag/tag';
import LxTag from '@lingxi-common-component/sirius-ui/Tag';

type InputSearchProps = Omit<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>, 'prefix'>;

export interface SearchInputProps extends InputSearchProps {
  onSearch?: (value: string, event?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  enterButton?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  checkedRcmdList?: string[];
  onRemoveRcmd?(name: string): void;
  hiddenSearch?: boolean;
}

const LIMITED_TAG_WIDTH = 28;
const TAG_LIST_COL_GAP = 8;

const FlexTag: React.FC<{
  onComputeWidth?(width: number): void;
  onClose?(): void;
}> = ({ onComputeWidth, onClose, children }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current?.offsetWidth) {
      onComputeWidth?.(ref.current.offsetWidth);
    }
  }, [ref.current?.offsetWidth]);
  return (
    <span
      className={styles.tag}
      ref={ref}
      style={{
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <LxTag closable onClose={onClose} height={26} type="label-6-1">
        {children}
      </LxTag>
    </span>
  );
};

const FlexbleTagList: React.FC<{
  list: string[];
  onRemoveRcmd?(name: string): void;
}> = ({ list, onRemoveRcmd }) => {
  const [showList, setShowList] = useState<string[]>([]);
  const [tagWidthMap, setTagWidthMap] = useState<Map<number, number>>(new Map());
  const [computeFinish, setComputeFinish] = useState<boolean>(false);
  const [ref, { width: containerWidth }] = useMeasure<HTMLSpanElement>();
  const handleCompute = (index: number, width: number) => {
    setTagWidthMap(prev => {
      return new Map(prev.set(index, width));
    });
  };

  useEffect(() => {
    setComputeFinish(false);
    setTagWidthMap(new Map());
  }, [list]);

  useEffect(() => {
    if (tagWidthMap.size === list.length) {
      // todo for rest elment
      const limitedWidth = containerWidth - LIMITED_TAG_WIDTH;
      const arr: number[] = [];
      tagWidthMap.forEach((value, index) => {
        arr[index] = value;
      });
      let totalLen = 0;
      const nextShowList = [];
      for (let jndex = 0; jndex < arr.length; jndex++) {
        const elementWidth = arr[jndex];
        totalLen += elementWidth;
        totalLen += TAG_LIST_COL_GAP;
        if (totalLen > limitedWidth) {
          break;
        } else {
          nextShowList.push(list[jndex]);
        }
      }
      setShowList(nextShowList);
      setComputeFinish(true);
    }
  }, [tagWidthMap, list, containerWidth]);

  return (
    <span className={styles.tagList} style={{ columnGap: TAG_LIST_COL_GAP }} ref={ref}>
      {!computeFinish &&
        list.map((e, index) => (
          <FlexTag
            onComputeWidth={width => {
              handleCompute(index, width);
            }}
            key={e}
            onClose={() => onRemoveRcmd?.(e)}
          >
            {e}
          </FlexTag>
        ))}
      {showList.map(e => (
        <span className={styles.tag} key={e}>
          <LxTag type="label-6-1" closable onClose={() => onRemoveRcmd?.(e)} height={26}>
            {e}
          </LxTag>
        </span>
      ))}
      {computeFinish && showList.length !== list.length && (
        <span className={styles.tag}>
          <LxTag type="label-6-1" width={LIMITED_TAG_WIDTH} height={26}>
            ...
          </LxTag>
        </span>
      )}
    </span>
  );
};

const GlobalSearchInput: React.ForwardRefExoticComponent<SearchInputProps> = React.forwardRef(
  ({ prefix, suffix, enterButton, onSearch, className, checkedRcmdList, onRemoveRcmd, onFocus, onBlur, onKeyDown, hiddenSearch, ...rest }, ref) => {
    const [inputFocus, setInputFocus] = useState<boolean>(false);
    const handleFixValue: <T>(value: T) => string = value => {
      if (typeof value === 'undefined' || value === null) {
        return '';
      }
      return String(value);
    };
    return (
      <div className={styles.inputWrapper}>
        <div
          className={classNames(styles.inputInnerWrapper, {
            [styles.inputInnerWrapperFocus]: inputFocus,
            [styles.inputInnerWrapperHidden]: hiddenSearch,
          })}
        >
          <span className={styles.inputPrefix}>{prefix}</span>
          <input
            onKeyDown={evt => {
              if (onSearch && evt.key === 'Enter' && !hiddenSearch) {
                onSearch(handleFixValue(rest.value), evt);
              }
              onKeyDown?.(evt);
            }}
            ref={ref}
            className={classNames(
              styles.inputInput,
              {
                [styles.inputInputWithList]: checkedRcmdList && checkedRcmdList.length > 0,
              },
              className
            )}
            onFocus={evt => {
              onFocus?.(evt);
              setInputFocus(true);
            }}
            onBlur={evt => {
              onBlur?.(evt);
              setInputFocus(false);
            }}
            {...rest}
          />
          {checkedRcmdList && checkedRcmdList.length > 0 && <FlexbleTagList list={checkedRcmdList} onRemoveRcmd={onRemoveRcmd} />}
          <span className={styles.inputSuffix}>{suffix}</span>
        </div>
        {hiddenSearch ? (
          ''
        ) : (
          <button
            className={styles.inputButton}
            onClick={e => {
              onSearch?.(handleFixValue(rest.value), e);
            }}
          >
            {enterButton}
          </button>
        )}
      </div>
    );
  }
);

export default GlobalSearchInput;
