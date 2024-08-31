import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Input } from 'antd';
import classnames from 'classnames/bind';
import { useObservable } from 'rxjs-hooks';
import { NIMApi, apiHolder } from 'api';
import { of, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import EditIcon from '@web-common/components/UI/Icons/svgs/EditPenSvg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import ClearIcon from '@web-common/components/UI/Icons/svgs/ClearSvg';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { useIMTeamField } from '../../common/hooks/useTeamInfo';
import styles from './teamInfoEditor.module.scss';
import { lookupEmoji, lookupLink, RichTextContent } from '../../subcontent/chatDisplay/chatItemText';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classnames.bind(styles);
export type TeamInfoEditType = 'anno' | 'intro';
interface TeamInfoValue {
  name?: string;
  intro?: string;
  anno?: string;
  oriName?: string;
  oriIntro?: string;
  oriAnno?: string;
}
interface TeamInfoRefProps {
  getTeamInfo: () => TeamInfoValue;
}
interface TeamInfoProps extends TeamInfoValue {
  type?: TeamInfoEditType;
  ref?: React.Ref<TeamInfoRefProps>;
}
const TeamInfoEditor: React.FC<TeamInfoProps> = React.forwardRef((props, ref) => {
  const { type, name: oriName = '', intro: oriIntro = '', anno: oriAnno = '' } = props;
  const [name, setName] = useState<string>(oriName.slice(0, 30));
  const [intro, setIntro] = useState<string>(oriIntro);
  const [anno, setAnno] = useState<string>(oriAnno);
  const onNameChange = e => {
    setName(e.target.value);
  };
  const onIntroChange = e => {
    setIntro(e.target.value);
  };
  const onAnnoChange = e => {
    setAnno(e.target.value);
  };
  const clearName = () => {
    setName('');
  };
  const clearIntro = () => {
    setIntro('');
  };
  const clearAnno = () => {
    setAnno('');
  };
  useImperativeHandle(ref, () => ({
    getTeamInfo: () => ({
      name,
      intro,
      anno,
    }),
  }));
  if (type === 'anno') {
    return (
      <div className={styles.infoEditor}>
        <div className={styles.teamItem}>
          <Input.TextArea
            data-test-id="im_session_anno_edit_input"
            placeholder={getIn18Text('QINGSHURUQUNGONG')}
            className={styles.input}
            bordered={false}
            maxLength={4500}
            showCount
            value={anno}
            onChange={onAnnoChange}
            autoSize={{ minRows: 14, maxRows: 14 }}
            autoFocus
          />
          <div data-test-id="im_session_anno_clear_btn" className={styles.clearTextIcon} onClick={clearAnno}>
            <ClearIcon />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.infoEditor}>
      <div className={styles.teamItem}>
        <span className={styles.label}>{getIn18Text('QUNMINGCHENG')}</span>
        <Input
          data-test-id="im_session_setting_edit_name_input"
          placeholder={getIn18Text('QINGSHURUQUNMING')}
          value={name}
          onChange={onNameChange}
          className={classnames(styles.input, styles.inputBox)}
          maxLength={30}
          autoFocus
          bordered={false}
        />
        <div className={styles.clearInputIcon} onClick={clearName}>
          <ClearIcon />
        </div>
      </div>
      <div className={styles.teamItem}>
        <span className={styles.label}>{getIn18Text('QUNJIANJIE')}</span>
        <Input.TextArea
          data-test-id="im_session_setting_edit_desc_input"
          placeholder={getIn18Text('QINGSHURUQUNJIAN')}
          className={styles.input}
          maxLength={100}
          showCount
          value={intro}
          onChange={onIntroChange}
          autoSize={{ minRows: 6, maxRows: 6 }}
          bordered={false}
        />
        {intro.trim().length ? (
          <div className={classnames(styles.clearTextIcon, styles.smallMarginIcon)} onClick={clearIntro}>
            <ClearIcon />
          </div>
        ) : null}
      </div>
    </div>
  );
});
interface TeamEditorModalProps extends TeamInfoProps {
  onOk: (info: TeamInfoValue) => void;
  onCancel: () => void;
  visible: boolean;
  teamId: string;
}
export const TeamInfoEditorModal: React.FC<TeamEditorModalProps> = props => {
  const { name: curName, onOk, onCancel, visible, intro: curIntro, teamId } = props;
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const refEditor = useRef<TeamInfoRefProps>(null);
  useEffect(() => {
    setEditorVisible(visible);
  }, [visible]);
  return (
    <Modal
      title={getIn18Text('BIANJIQUNXINXI')}
      width={600}
      wrapClassName="im-team"
      visible={editorVisible}
      onOk={() => {
        const info = refEditor.current?.getTeamInfo() || {};
        onOk && onOk({ ...info, oriName: curName, oriIntro: curIntro });
      }}
      onCancel={onCancel}
      closeIcon={<CloseIcon className="dark-invert" />}
    >
      <TeamInfoEditor ref={refEditor} name={curName} intro={curIntro} type="intro" />
    </Modal>
  );
};
interface TeamAnnoCatApi {
  anno: string;
}
export const TeamAnnoCat: React.FC<TeamAnnoCatApi> = props => {
  const { anno } = props;
  return <RichTextContent originTextContent={anno} lookupArr={[lookupLink, lookupEmoji]} classnames={realStyle('annoCatContent')} />;
};
interface TeamAnnoHeaderApi {
  status: 'read' | 'write';
  setStatus(status: 'read' | 'write'): void;
}
export const TeamAnnoHeader: React.FC<TeamAnnoHeaderApi> = props => {
  const { status, setStatus } = props;
  const [iconColor, setIconColor] = useState<string>('');
  if (status === 'read') {
    return (
      <div className={realStyle('teamAnnoHeader')}>
        <p className={realStyle('title')}>{getIn18Text('QUNGONGGAO')}</p>
        {/* {TEAM_AUTH_EXPLAIN.teamAnnouncement.includes(角色) && ( */}
        <span
          data-test-id="im_session_anno_edit_icon"
          className={realStyle('editIcon')}
          onClick={() => {
            setStatus('write');
          }}
          onMouseEnter={() => setIconColor('#2264DF')}
          onMouseLeave={() => setIconColor('')}
        >
          <EditIcon stroke={iconColor} />
        </span>
        {/* )} */}
      </div>
    );
  }
  return (
    <div className={realStyle('teamAnnoHeader')}>
      <p className={realStyle('title')}>{getIn18Text('BIANJIQUNGONGGAO')}</p>
    </div>
  );
};
export const TeamAnnoEditorModal: React.FC<Omit<TeamEditorModalProps, 'type'>> = props => {
  const { teamId, onOk, onCancel, visible } = props;
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const anno = useObservable(
    (_, $props) =>
      (nimApi.imteamStream.getTeamField($props) as Observable<string>).pipe(
        map(item => {
          let text = '';
          try {
            const _anno = JSON.parse(item || '') as {
              text: string;
            };
            text = _anno.text;
          } catch (ex) {}
          return text;
        })
      ),
    '',
    [teamId, 'announcement']
  );
  const refEditor = useRef<TeamInfoRefProps>(null);
  useEffect(() => {
    setEditorVisible(visible);
  }, [visible]);
  const [editorStatus, setEditorStatus] = useState<'read' | 'write'>('read');
  if (editorStatus === 'read') {
    return (
      <Modal
        wrapClassName={realStyle('imTeamAnnoCat')}
        title={<TeamAnnoHeader status={editorStatus} setStatus={setEditorStatus} />}
        width={600}
        bodyStyle={{ padding: 0 }}
        visible={editorVisible}
        onCancel={onCancel}
        footer={null}
        getContainer={() => document.body}
      >
        <TeamAnnoCat anno={anno} />
      </Modal>
    );
  }
  return (
    <Modal
      title={<TeamAnnoHeader status={editorStatus} setStatus={setEditorStatus} />}
      width={600}
      wrapClassName="im-team"
      visible={editorVisible}
      onOk={() => {
        const info = refEditor.current?.getTeamInfo() || {};
        onOk && onOk(info);
      }}
      onCancel={onCancel}
      afterClose={() => {
        setEditorStatus('read');
      }}
      okText={getIn18Text('FABU')}
      getContainer={() => document.body}
      closeIcon={<CloseIcon className="dark-invert" />}
    >
      <TeamInfoEditor ref={refEditor} anno={anno} type="anno" />
    </Modal>
  );
};
export default TeamInfoEditor;
