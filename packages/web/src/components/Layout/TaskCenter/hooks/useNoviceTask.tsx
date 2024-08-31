import { getIn18Text } from 'api';
import React, { useMemo } from 'react';
import { NoviceTaskHandleItem } from 'api';
import { Popover, PopoverProps } from 'antd';
import { NoviceTaskActions } from '@web-common/state/reducer';
import { getNoviceTask } from '@web-common/state/reducer/noviceTaskReducer';
import { useAppSelector, useActions } from '@web-common/state/createStore';
import { showNoviceTaskCloseTip } from '@/components/Layout/TaskCenter/utils';
import style from './useNoviceTask.module.scss';

export interface NoviceTaskParams {
  moduleType: string;
  taskType: string;
}

const DefaultPopover: React.FC = props => <>{props.children}</>;

const useNoviceTask = (params: NoviceTaskParams) => {
  const { moduleType, taskType } = params;
  const { startNoviceTask, commitNoviceTask, quitNoviceTask } = useActions(NoviceTaskActions);

  const noviceTask: NoviceTaskHandleItem | null = useAppSelector(state => getNoviceTask(state.noviceTaskReducer, moduleType, taskType));

  const start = (startStep?: number) => {
    if (noviceTask && noviceTask.handling) {
      startNoviceTask({ moduleType, taskType, startStep });
    }
  };

  const commit = (commitStep: number) => {
    if (noviceTask && noviceTask.handling) {
      commitNoviceTask({ moduleType, taskType, commitStep });
    }
  };

  const quit = () => {
    if (noviceTask && noviceTask.handling) {
      quitNoviceTask({ moduleType, taskType });
    }
  };

  const Popovers = useMemo(() => {
    if (noviceTask && noviceTask.handling) {
      const { steps, step, handling } = noviceTask;

      return new Array(steps.length).fill(1).map((_, index) => {
        const NovicePopover: React.FC<PopoverProps> = props => {
          const { children, ...rest } = props;
          const stepItem = steps[index];

          if (!stepItem || !handling) return <>{children}</>;

          return (
            <Popover
              visible={index + 1 === step}
              content={
                <div className={style.contentWrapper}>
                  <div className={style.contentBody}>{stepItem.content}</div>
                  <div className={style.contentFooter}>
                    <span>
                      {index + 1}/{steps.length}
                    </span>
                    <span
                      className={style.quit}
                      onClick={() => {
                        quit();
                        showNoviceTaskCloseTip();
                      }}
                    >
                      {getIn18Text('TUICHU')}
                    </span>
                  </div>
                </div>
              }
              overlayClassName={style.noviceTaskOverlay}
              getPopupContainer={node => node.parentElement || document.body}
              {...rest}
            >
              {children}
            </Popover>
          );
        };

        return NovicePopover;
      });
    }

    return [];
  }, [noviceTask]);

  const getPopoverByStep = (popoverStep: number) => {
    const Popover = Popovers[popoverStep - 1];

    return Popover || DefaultPopover;
  };

  const handling = noviceTask ? noviceTask.handling : false;

  return {
    quit,
    start,
    commit,
    handling,
    getPopoverByStep,
  };
};

// Usage
// const App = () => {
//   const { start, commit, getPopoverByStep } = useNoviceTask({
//     taskId: '1',
//     steps: [
//       { content: '一' },
//       { content: '二' },
//       { content: '三' },
//     ],
//   });

//   useEffect(() => {
//     start();
//   }, []);

//   const Popover1 = getPopoverByStep(1);

//   return (
//     <div>
//       <Popover1>
//         <span onClick={() => commit(1)}>123</span>
//       </Popover1>
//     </div>
//   );
// };

export { useNoviceTask };
