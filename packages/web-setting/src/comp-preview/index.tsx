import React, { useRef, useState } from 'react';
import { apiHolder as api, DataStoreApi } from 'api';
import { message, Image, List } from 'antd';
import variables from '@web-common/styles/export.module.scss';
import moment from 'moment';
import noConImg from '@/images/no_contacts.png';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Tooltip from '@web-common/components/UI/Tooltip';
import Tag from '@web-common/components/UI/Tag';
import Divider from '@web-common/components/UI/Divider';
import ButtonList from '@web-common/components/UI/Button/list';
import Alert from '@web-common/components/UI/Alert/Alert';
import { withImageContext } from '@web-common/components/UI/ContextMenu/ImgContextMenu';
import TitleRightContextMenu from '@web-common/components/UI/ContextMenu/TextContextMenu';
import Dialog from '@web-common/components/UI/Dialog/dialog';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuide/hollowOutGuide';
import HollowOutGuideNew from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import LightGuide from '@web-common/components/UI/LightGuide/index';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { SearchLoading } from '@web-common/components/UI/SearchLoading/searchLoading';
import SiriusRadio from '@web-common/components/UI/SiriusRadio';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';
import PageHeader from '@web-common/components/UI/PageHeader';
import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Icons from './icons';
import NewIcons from './newIcons';
import IconCard from '@web-common/components/UI/IconCard/index';
import styles from './index.module.scss';
import { SelectComponent } from './select';
import { InputComponent } from './input';
import { PaginationComponent } from './pagination';
import { TableComponent } from './table';
import { CascaderComponent } from './cascader';
import DatePicker from '@web-common/components/UI/DatePicker';
import TimePicker from '@web-common/components/UI/TimePicker';
import Badge from '@web-common/components/UI/SiriusBadge';

const { RangePicker } = DatePicker;

const storeApi: DataStoreApi = api.api.getDataStoreApi();
const ContextImage = withImageContext(Image);

interface Props {
  isVisible?: boolean;
}

const CompPreview: React.FC<Props> = props => {
  const { isVisible = false } = props;
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [isShowSingleGuide, setShowSingleGuide] = useState<boolean>(false); // 蒙层引导（单步）
  const [isShowTwoGuide, setShowTwoGuide] = useState<boolean>(false); // 蒙层引导（两步）
  const [isShowMuchGuide, setShowMuchGuide] = useState<boolean>(false); // 蒙层引导（大于两步）
  const [isShowSingleImgGuide, setShowSingleImgGuide] = useState<boolean>(false); // 图文气泡引导（单步）
  const [isShowTwoImgGuide, setShowTwoImgGuide] = useState<boolean>(false); // 图文气泡引导（两步）
  const [isShowMuchImgGuide, setShowMuchImgGuide] = useState<boolean>(false); // 图文气泡引导（大于两步）
  const [isShowTipGuide1, setShowTipGuide1] = useState<boolean>(false);
  const [isShowTipGuide2, setShowTipGuide2] = useState<boolean>(false);
  const [isShowLightGuide, setShowLightGuide] = useState<boolean>(true);
  const [lxPopoverVisible, setLxPopoverVisible] = useState<boolean>(false);
  const [lxPopoverPositon, setLxPopoverPositon] = useState<{ top: number; left: number }>({ left: 0, top: 0 });
  const [siriusModalvisible, setSiriusModalvisible] = useState<boolean>(false);
  const [radioCheck, setRadioCheck] = useState<boolean>(false);
  const titileRef = useRef<HTMLDivElement>(null);
  const hollowOutGuideRef = useRef<any>(null);
  const hooks = [
    { name: 'name', info: '描述', path: 'path', author: 'author' },
    { name: 'usePagination', info: '分页配置', path: '@/hooks/usePagination.ts', author: 'huangzhongjian@office.163.com' },
    { name: 'useAsyncEffect', info: 'useEffect中的异步请求', path: '@web-common/hooks/useAsyncEffect.ts', author: '' },
    { name: 'useClickAway', info: '多个不同的事件绑定相同回调', path: '@web-common/hooks/useClickAway.ts', author: '' },
    {
      name: 'useCreateCallbackForEvent',
      info: '将内部方法包装之后，传递给window的监听器，实现被包装函数中可以访问state中最新的值',
      path: '@web-common/hooks/useCreateCallbackForEvent.ts',
      author: 'zhangpeiyuan@office.163.com',
    },
    { name: 'useDebounceForEffect', info: 'useEffect 防抖', path: '@web-common/hooks/useDebounceForEffect.ts', author: 'zhangpeiyuan@office.163.com' },
    { name: 'useDoubleClick', info: '鼠标双击', path: '@web-common/hooks/useDoubleClick.ts', author: 'zhangpeiyuan@office.163.com' },
    { name: 'useEventListener', info: '消息监听', path: '@web-common/hooks/useEventListener.ts', author: '' },
    { name: 'useMsgCallback', info: '消息监听', path: '@web-common/hooks/useMsgCallback.ts', author: '' },
    {
      name: 'useMsgRenderCallback',
      info: '消息监听，顺序执行回调，保证回调执行可以拿到上传执行的最新state',
      path: '@web-common/hooks/useMsgRenderCallback.ts',
      author: '',
    },
    { name: 'useEventObserver', info: '监听error消息', path: '@web-common/hooks/useEventObserver.ts', author: '' },
    { name: 'useGetProductAuth', info: '权限标签管理', path: '@web-common/hooks/useGetProductAuth.ts', author: '' },
    { name: 'useGetUniqReqWrap', info: '同一个接口多次调用，只会生效最后一次', path: '@web-common/hooks/useGetUniqReqWrap.ts', author: 'zhangpeiyuan@office.163.com' },
    { name: 'useScale', info: '监听鼠标滚轮事件', path: '@web-common/hooks/useScale.ts', author: '' },
    { name: 'useSyncDoubleClick', info: '鼠标单击双击事件', path: '@web-common/hooks/useSyncDoubleClick.ts', author: 'zhangpeiyuan@office.163.com' },
    {
      name: 'useWriteFileToLocalByMid',
      info: '通过File对象，将文件copy到系统的mid命名的文件夹中',
      path: '@web-common/hooks/useSyncDoubleClick.ts',
      author: 'lujiajian@office.163.com',
    },
    { name: 'windowResize', info: '监听视图调整大小时的 resize 事件', path: '@web-common/hooks/windowResize.ts', author: '' },
    { name: 'useRandomIds', info: '生成随机id', path: '@web-apps/hooks/useRandomIds.ts', author: '' },
    { name: 'useDownLoad', info: '下载table表格', path: '@web-edm/hooks/useDownLoad.ts', author: 'fanyeer01@office.163.com' },
  ];
  const mailDiscussGuides = [
    { id: 'ljj-first-step', title: '这是第一步的title', intro: '这是第一步的info' },
    { id: 'ljj-second-step', title: '这是第二步的title', intro: '这是第二步的info' },
  ];
  const selectOptions = [
    { value: 'jack', label: 'Jack' },
    { value: 'lucy', label: 'Lucy' },
    { value: 'disabled', disabled: true, label: 'Disabled' },
    { value: 'Yiminghe', label: 'yiminghe' },
  ];
  const showToast = (type: string) => {
    message.open({
      // @ts-ignore
      type,
      content: '孙迎凯孙迎凯孙迎凯孙迎凯',
      duration: 120,
    });
  };
  const showAlert = (type: 'info' | 'warn' | 'error' | 'destroyAll') => {
    if (type === 'destroyAll') {
      Alert.destroyAll();
    }
    Alert[type]({
      title: `这是${type}标题`,
      content: `这是${type}内容`,
    });
  };
  const showSiriusMessage = (type: 'success' | 'info' | 'error' | 'warn') => {
    SiriusMessage[type]({
      content: `这是${type}内容`,
    });
  };
  const guideShowCallback = () => {
    // 设置locallocalStroage 等
  };
  const hollowOutGuideNewReset = () => {
    setShowSingleGuide(false);
    setShowTwoGuide(false);
    setShowMuchGuide(false);
    storeApi.del('ljjTestHollowOutGuideNewSingle');
    storeApi.del('ljjTestHollowOutGuideNewTwo');
    storeApi.del('ljjTestHollowOutGuideNewMuch');
  };
  const hollowOutImgGuideNewReset = () => {
    setShowSingleImgGuide(false);
    setShowTwoImgGuide(false);
    setShowMuchImgGuide(false);
    storeApi.del('ljjTestHollowOutImgGuideNewSingle');
    storeApi.del('ljjTestHollowOutImgGuideNewTwo');
    storeApi.del('ljjTestHollowOutImgGuideNewMuch');
  };
  const hollowOutTipGuideNewReset = () => {
    setShowTipGuide1(false);
    setShowTipGuide2(false);
    storeApi.del('ljjTestHollowOutTipGuideNew1');
    storeApi.del('ljjTestHollowOutTipGuideNew2');
  };
  const allGuideReset = () => {
    setShowSingleGuide(false);
    setShowTwoGuide(false);
    setShowMuchGuide(false);
    setShowSingleImgGuide(false);
    setShowTwoImgGuide(false);
    setShowMuchImgGuide(false);
    setShowTipGuide1(false);
    setShowTipGuide2(false);
    storeApi.del('ljjTestHollowOutGuideNewSingle');
    storeApi.del('ljjTestHollowOutGuideNewTwo');
    storeApi.del('ljjTestHollowOutGuideNewMuch');
    storeApi.del('ljjTestHollowOutImgGuideNewSingle');
    storeApi.del('ljjTestHollowOutImgGuideNewTwo');
    storeApi.del('ljjTestHollowOutImgGuideNewMuch');
    storeApi.del('ljjTestHollowOutTipGuideNew1');
    storeApi.del('ljjTestHollowOutTipGuideNew2');
  };
  const openAllGuide = () => {
    setShowTwoGuide(true);
    setShowSingleImgGuide(true);
    setShowMuchImgGuide(true);
    setShowTipGuide1(true);
    setShowTwoImgGuide(true);
    setShowTipGuide2(true);
    setShowMuchGuide(true);
    setShowSingleGuide(true);
  };
  const lightGuideReset = () => {
    setShowLightGuide(false);
    storeApi.del('ljjTestLightGuide');
    setTimeout(() => {
      setShowLightGuide(true);
    }, 500);
  };
  const lxPopoverClick = (e: any) => {
    setLxPopoverVisible(true);
    setLxPopoverPositon({ left: e.clientX, top: e.clientY });
  };
  const onSelectChange = (val: string) => {
    console.log('comp_preview', val);
  };
  const imgPreviewFn = () => {
    const previewData = [
      {
        downloadUrl: 'https://img-blog.csdnimg.cn/5eb39ba135e644c6830e56a47ece3daf.png',
        previewUrl: 'https://img-blog.csdnimg.cn/5eb39ba135e644c6830e56a47ece3daf.png',
        OriginUrl: 'https://img-blog.csdnimg.cn/5eb39ba135e644c6830e56a47ece3daf.png',
        size: 200,
        name: '预览图片1',
      },
      {
        downloadUrl: 'https://img-blog.csdnimg.cn/6d15082ac7234ec7a16065e74f689590.jpeg',
        previewUrl: 'https://img-blog.csdnimg.cn/6d15082ac7234ec7a16065e74f689590.jpeg',
        OriginUrl: 'https://img-blog.csdnimg.cn/6d15082ac7234ec7a16065e74f689590.jpeg',
        size: 200,
        name: '预览图片二',
      },
    ];
    ImgPreview.preview({ data: previewData, startIndex: 0 });
  };

  return (
    <div hidden={!isVisible} className={styles.compPreviewBox}>
      <p className={styles.settingTitle}>组件预览</p>
      <div className={styles.compList}>
        <p className={styles.compListTitle}>页头（新）</p>
        <PageHeader
          className="page-header-test-class-name"
          title="页面标题"
          titleExtraIcon={<IconCard type="tongyong_cuowutishi_xian" />}
          subTitle="这是一段说明文案"
          extra={
            <>
              <Button>次要按钮</Button>
            </>
          }
          onBack={() => {
            alert('点了返回');
          }}
        />
        <br />
        <PageHeader
          bgTransparent
          backIcon={<IconCard type="tongyong_jiantou_zuo1" />}
          title="页面标题"
          titleExtraIcon={<IconCard type="tongyong_cuowutishi_xian" />}
          subTitle="这是一段说明文案"
          extra={
            <>
              <Button>次要按钮</Button>
            </>
          }
        />
        <br />
        <PageHeader
          backIcon={false}
          title="页面标题"
          titleExtraIcon={<IconCard type="tongyong_cuowutishi_xian" />}
          subTitle="这是一段说明文案"
          extra={
            <>
              <Button>次要按钮</Button>
            </>
          }
        />
        <br />
        <PageHeader
          backIcon={false}
          title="页面标题"
          subTitle="这是一段说明文案"
          extra={
            <>
              <Button>次要按钮</Button>
            </>
          }
        />
        <br />
        <PageHeader
          backIcon={false}
          title="页面标题"
          extra={
            <>
              <Button>次要按钮</Button>
            </>
          }
        />
        <br />
        <PageHeader backIcon={false} title="页面标题" />
        <p className={styles.compListTitle}>面包屑（新）</p>
        <Breadcrumb>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application Center</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application List</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>An Application</Breadcrumb.Item>
        </Breadcrumb>
        <p></p>
        <Breadcrumb arrowSeparator>
          <Breadcrumb.Item>Home(箭头分隔符)</Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application Center</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application List</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>An Application</Breadcrumb.Item>
        </Breadcrumb>
        <p></p>
        <Breadcrumb separator="">
          <Breadcrumb.Item>Location(自定义分隔符)</Breadcrumb.Item>
          <Breadcrumb.Separator>:</Breadcrumb.Separator>
          <Breadcrumb.Item href="">Application CenterApplication CenterApplication CenterApplication CenterApplication Center</Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item href="">Application List</Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>An Application</Breadcrumb.Item>
        </Breadcrumb>
        <p></p>
        <Breadcrumb arrowSeparator>
          <Breadcrumb.Item>Home(箭头分隔符)</Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application Center</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="">Application List</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>An Application</Breadcrumb.Item>
        </Breadcrumb>
        <p className={styles.compListTitle}>级联选择器 Cascader（新）</p>
        <CascaderComponent />
        <p className={styles.compListTitle}>分页器 Pagination（新）</p>
        <PaginationComponent />
        <p className={styles.compListTitle}>表格 Table（新）</p>
        <TableComponent />
        <p className={styles.compListTitle}>选择器 Select（新）</p>
        <SelectComponent />
        <p className={styles.compListTitle}>输入框 Input（新）</p>
        <InputComponent />
        <p className={styles.compListTitle}>日期选择器（新）</p>
        <DatePicker />
        <DatePicker picker="week" />
        <DatePicker picker="month" />
        <DatePicker picker="quarter" />
        <DatePicker picker="year" />
        <br />
        <DatePicker allowClear={false} defaultValue={moment('2022-09-08', 'YYYY-MM-DD')} width={200} />
        <br />
        <RangePicker />
        <br />
        <RangePicker
          ranges={{
            Today: [moment(), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
          }}
        />
        <br />
        <DatePicker defaultValue={moment('2022-09-08', 'YYYY-MM-DD')} disabled />
        <p className={styles.compListTitle}>时间选择器（新）</p>
        <TimePicker value={moment('22:30', 'HH:mm')} />
        <br />
        <TimePicker value={moment('22:30', 'HH:mm')} disabled />
        <p className={styles.compListTitle}>按钮（新）</p>
        <ButtonList />
        <p className={styles.compListTitle}>Tag(标签)（新）</p>
        <div className={styles.compListBox}>
          <Tag type="label-1-1" hideBorder={true}>
            优质客户
          </Tag>
          <Tag type="label-2-1" hideBorder={true}>
            优质客户
          </Tag>
          <Tag type="label-3-1" hideBorder={true}>
            优质客户
          </Tag>
          <Tag type="label-4-1" hideBorder={true}>
            优质客户
          </Tag>
          <Tag type="label-5-1" hideBorder={true}>
            优质客户
          </Tag>
          <Tag type="label-6-1" hideBorder={true}>
            优质客户
          </Tag>
        </div>
        <div className={styles.compListBox}>
          <Tag type="label-1-1">优质客户</Tag>
          <Tag type="label-2-1">优质客户</Tag>
          <Tag type="label-3-1">优质客户</Tag>
          <Tag type="label-4-1">优质客户</Tag>
          <Tag type="label-5-1">优质客户</Tag>
          <Tag type="label-6-1">优质客户</Tag>
        </div>
        <div className={styles.compListBox}>
          <Tag type="label-1-1" closable={true}>
            优质客户
          </Tag>
          <Tag type="label-2-1" closable={true}>
            优质客户
          </Tag>
          <Tag type="label-3-1" closable={true}>
            优质客户
          </Tag>
          <Tag type="label-4-1" closable={true}>
            优质客户
          </Tag>
          <Tag type="label-5-1" closable={true}>
            优质客户
          </Tag>
          <Tag type="label-6-1" closable={true}>
            优质客户
          </Tag>
        </div>
        <div className={styles.compListBox}>
          <Tag bgColor="#fff" borderColor="#4C6AFF" fontColor="#4C6AFF">
            群主
          </Tag>
          <Tag bgColor="#fff" borderColor="#FFB54C" fontColor="#FFB54C">
            未启用
          </Tag>
          <Tag bgColor="#fff" borderColor="#FE5B4C" fontColor="#FE5B4C">
            已失效
          </Tag>
          <Tag bgColor="#fff" borderColor="#0FD683" fontColor="#0DC076">
            通过
          </Tag>
        </div>
        <p className={styles.compListTitle}>分割线（新）</p>
        <div className={styles.compListBox}>
          <Divider color="#EBEDF2" />
        </div>
        <div className={styles.compListBox}>
          <Divider>Title</Divider>
        </div>
        <p className={styles.compListTitle}>徽标（新）</p>
        <p className={styles.compListBox}>
          <Badge count={9}>
            <div className={styles.grayBlock} />
          </Badge>
          <Badge count={99}>
            <div className={styles.grayBlock} />
          </Badge>
          <Badge dot>
            <div className={styles.grayBlock} />
          </Badge>
          <Badge dot dotSize="small">
            <div className={styles.grayBlock} />
          </Badge>
          <Badge dot color={variables.fill5}>
            <div className={styles.grayBlock} />
          </Badge>
          <Badge dot color={variables.fill5} dotSize="small">
            <div className={styles.grayBlock} />
          </Badge>
          <Badge intro="新">
            <div className={styles.grayBlock} />
          </Badge>
          <Badge intro="新功能">
            <div className={styles.grayBlock} />
          </Badge>
          <Badge intro="热点">
            <div className={styles.grayBlock} />
          </Badge>
          <Badge intro="新产品">
            <div className={styles.grayBlock} />
          </Badge>
        </p>
        <p className={styles.compListBox}>
          <Badge count={9} style={{ backgroundColor: variables.fill5 }} />
          <Badge count={9} />
          <Badge count={99} />
          <Badge count={200} overflowCount={99} />
          <Badge count={1223} overflowCount={999} />
          <Badge intro="新" />
          <Badge intro="新功能" />
          <Badge intro="Beta" style={{ backgroundColor: variables.success6 }} />
          <Badge intro="展会" style={{ backgroundColor: variables.success6 }} />
          <Badge dot />
          <Badge dot dotSize="small" />
          <Badge dot color={variables.fill5} />
          <Badge dot color={variables.fill5} dotSize="small" />
        </p>
        <p className={styles.compListTitle}>Tooltip文字提示（新）</p>
        <p className={styles.compListBox}>
          <Tooltip title="文字气泡" trigger="click">
            <Button>Tooltip目标元素-top</Button>
          </Tooltip>
          <Tooltip title="文字气泡" trigger="click" placement="left">
            <Button>Tooltip目标元素-left</Button>
          </Tooltip>
          <Tooltip title="文字气泡" trigger="click" placement="right">
            <Button>Tooltip目标元素-right</Button>
          </Tooltip>
          <Tooltip title="文字气泡" trigger="click" placement="bottom">
            <Button>Tooltip目标元素-bottom</Button>
          </Tooltip>
        </p>
        <p className={styles.compListTitle}>toast预览(包括shadow)（新）</p>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              showToast('info');
            }}
          >
            info(120s)
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showToast('warning');
            }}
          >
            warn(120s)
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showToast('error');
            }}
          >
            error(120s)
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showToast('success');
            }}
          >
            success(120s)
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showToast('loading');
            }}
          >
            loading(120s)
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              message.destroy();
            }}
          >
            销毁
          </Button>
        </div>
        <p className={styles.compListTitle}>Alert（旧）</p>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              showAlert('info');
            }}
          >
            info
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showAlert('warn');
            }}
          >
            warn
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showAlert('error');
            }}
          >
            error
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showAlert('destroyAll');
            }}
          >
            destroyAll
          </Button>
        </div>
        {/* <p className={styles.compListTitle}>图片预览（旧）</p> */}
        {/* <ContextImage width="556px" height="347px" src="https://img-blog.csdnimg.cn/5eb39ba135e644c6830e56a47ece3daf.png" ext="这是ext" alt="这是alt" /> */}
        <p className={styles.compListTitle}>右键文本唤起操作下拉列表（复制，全选）（旧）</p>
        <TitleRightContextMenu targetNode={titileRef.current}>
          <div ref={titileRef}>请右键点击这里（文案）</div>
        </TitleRightContextMenu>
        <p className={styles.compListTitle}>Dialog（旧）</p>
        <Button
          btnType="primary"
          onClick={() => {
            setDialogVisible(true);
          }}
        >
          唤起Dialog
        </Button>
        <Dialog
          isModalVisible={dialogVisible}
          content="提示弹窗的content"
          onOk={() => {
            setDialogVisible(false);
          }}
        />
        <p className={styles.compListTitle}>新手引导 HollowOutGuide（旧）</p>
        <HollowOutGuide ref={hollowOutGuideRef} guides={mailDiscussGuides} />
        <div className={styles.compListBox}>
          <span id="ljj-first-step">第一步</span> <span id="ljj-second-step">第二步</span>
        </div>
        <Button
          btnType="primary"
          onClick={() => {
            hollowOutGuideRef.current?.showSelf(guideShowCallback);
          }}
        >
          唤起新手引导
        </Button>
        <p className={styles.compListTitle}>
          新手引导 HollowOutGuideNew（新）&nbsp;&nbsp;&nbsp;
          <Button btnType="primary" onClick={openAllGuide}>
            唤起所有引导
          </Button>
          <Button btnType="primary" onClick={allGuideReset}>
            重置所有引导
          </Button>
        </p>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              setShowSingleGuide(true);
            }}
          >
            唤起蒙层新手引导（单步）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowTwoGuide(true);
            }}
          >
            唤起蒙层新手引导（两步）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowMuchGuide(true);
            }}
          >
            唤起蒙层新手引导（大于两步）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowSingleGuide(true);
              setShowTwoGuide(true);
              setShowMuchGuide(true);
            }}
          >
            唤起所有蒙层引导
          </Button>
          <Button btnType="primary" onClick={hollowOutGuideNewReset}>
            重置
          </Button>
        </div>
        <div>
          <HollowOutGuideNew enable={isShowSingleGuide} guideId="ljjTestHollowOutGuideNewSingle" title="单步title" intro="单步info" placement="right">
            <span>(蒙层引导单步)目标元素</span>
          </HollowOutGuideNew>
        </div>
        <div>
          <HollowOutGuideNew enable={isShowTwoGuide} guideId="ljjTestHollowOutGuideNewTwo" title="这是第一步的title" intro="这是第一步的info" step={1} placement="bottom">
            <span>(蒙层引导共两步)目标元素(第一步)</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew enable={isShowTwoGuide} guideId="ljjTestHollowOutGuideNewTwo" title="这是第二步的title" intro="这是第二步的info" step={2} placement="left">
            <span>(蒙层引导共两步)目标元素(第二步)</span>
          </HollowOutGuideNew>
        </div>
        <div>
          <HollowOutGuideNew enable={isShowMuchGuide} guideId="ljjTestHollowOutGuideNewMuch" title="这是第一步的title" intro="这是第一步的info" step={1} placement="top">
            <span>(蒙层引导共三步)目标元素(第一步)</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew
            enable={isShowMuchGuide}
            guideId="ljjTestHollowOutGuideNewMuch"
            title="这是第二步的title"
            intro="这是第二步的info"
            step={2}
            showArrow={false}
          >
            <span>(蒙层引导共三步)目标元素(第二步)</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew enable={isShowMuchGuide} guideId="ljjTestHollowOutGuideNewMuch" title="这是第三步的title" intro="这是第三步的info" step={3}>
            <span>(蒙层引导共三步)目标元素(第三步)</span>
          </HollowOutGuideNew>
        </div>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              setShowSingleImgGuide(true);
            }}
          >
            唤起气泡图文引导（单步）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowTwoImgGuide(true);
            }}
          >
            唤起气泡图文引导（两步）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowMuchImgGuide(true);
            }}
          >
            唤起气泡图文引导（大于两步）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowSingleImgGuide(true);
              setShowTwoImgGuide(true);
              setShowMuchImgGuide(true);
            }}
          >
            唤起所有气泡图文引导
          </Button>
          <Button btnType="primary" onClick={hollowOutImgGuideNewReset}>
            重置
          </Button>
        </div>
        <div>
          <HollowOutGuideNew type="2" enable={isShowSingleImgGuide} guideId="ljjTestHollowOutImgGuideNewSingle" title="单步title" intro="单步info">
            <span>(气泡图文引导单步)目标元素</span>
          </HollowOutGuideNew>
        </div>
        <div>
          <HollowOutGuideNew
            type="2"
            enable={isShowTwoImgGuide}
            contentImg="https://img-blog.csdnimg.cn/5eb39ba135e644c6830e56a47ece3daf.png"
            guideId="ljjTestHollowOutImgGuideNewTwo"
            title="这是第一步的title"
            intro="这是第一步的info"
            step={1}
          >
            <span>(气泡图文引导共两步)目标元素(第一步)</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew
            type="2"
            enable={isShowTwoImgGuide}
            contentImg={noConImg}
            guideId="ljjTestHollowOutImgGuideNewTwo"
            title="这是第二步的title"
            intro="这是第二步的info"
            step={2}
          >
            <span>(气泡图文引导共两步)目标元素(第二步)</span>
          </HollowOutGuideNew>
        </div>
        <div>
          <HollowOutGuideNew type="2" enable={isShowMuchImgGuide} guideId="ljjTestHollowOutImgGuideNewMuch" title="这是第一步的title" intro="这是第一步的info" step={1}>
            <span>(气泡图文引导共三步)目标元素(第一步)</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew type="2" enable={isShowMuchImgGuide} guideId="ljjTestHollowOutImgGuideNewMuch" title="这是第二步的title" intro="这是第二步的info" step={2}>
            <span>(气泡图文引导共三步)目标元素(第二步)</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew type="2" enable={isShowMuchImgGuide} guideId="ljjTestHollowOutImgGuideNewMuch" title="这是第三步的title" intro="这是第三步的info" step={3}>
            <span>(气泡图文引导共三步)目标元素(第三步)</span>
          </HollowOutGuideNew>
        </div>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              setShowTipGuide1(true);
            }}
          >
            唤起气泡单行引导
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowTipGuide2(true);
            }}
          >
            唤起气泡单行引导（长文本）
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              setShowTipGuide1(true);
              setShowTipGuide2(true);
            }}
          >
            唤起所有气泡单行引导
          </Button>
          <Button btnType="primary" onClick={hollowOutTipGuideNewReset}>
            重置
          </Button>
        </div>
        <div>
          <HollowOutGuideNew type="3" enable={isShowTipGuide1} guideId="ljjTestHollowOutTipGuideNew1" title="这是title">
            <span>(唤起气泡单行引导)目标元素</span>
          </HollowOutGuideNew>
          <HollowOutGuideNew
            placement="top"
            type="3"
            enable={isShowTipGuide2}
            guideId="ljjTestHollowOutTipGuideNew2"
            title="这是title这是title这是title这是title这是title这是title这是title这是title这是title"
          >
            <span>(唤起气泡单行引导)目标元素</span>
          </HollowOutGuideNew>
        </div>
        {/* <p className={styles.compListTitle}>图片预览（旧）</p> */}
        {/* <Button btnType="primary" onClick={imgPreviewFn}>
          点击预览
        </Button> */}
        <p className={styles.compListTitle}>引导提示（旧）</p>
        <Button btnType="primary" onClick={lightGuideReset}>
          重置
        </Button>
        <div className={styles.compListBox}>
          <LightGuide guideId="ljjTestLightGuide" title="这是引导提示的文案，5秒自动消失" width={318} enable={isShowLightGuide}>
            目标元素
          </LightGuide>
        </div>
        <p className={styles.compListTitle}>气泡卡片（旧）</p>
        <div className={styles.compListBox}>
          <Button btnType="primary" onClick={lxPopoverClick}>
            唤起LxPopover
          </Button>
        </div>
        <div className={styles.compListBox}>
          <LxPopover top={lxPopoverPositon.top} left={lxPopoverPositon.left} right={0} bottom={0} visible={lxPopoverVisible} setVisible={setLxPopoverVisible}>
            <div style={{ width: 160, height: 20 }}>目标元素</div>
          </LxPopover>
        </div>
        <p className={styles.compListTitle}>全局提示 SiriusMessage（旧）（已废弃，请使用【toast预览】）</p>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              showSiriusMessage('success');
            }}
          >
            success
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showSiriusMessage('info');
            }}
          >
            info
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showSiriusMessage('warn');
            }}
          >
            warn
          </Button>
          <Button
            btnType="primary"
            onClick={() => {
              showSiriusMessage('error');
            }}
          >
            error
          </Button>
        </div>
        <p className={styles.compListTitle}>弹窗 Modal（旧）</p>
        <div className={styles.compListBox}>
          <Button
            btnType="primary"
            onClick={() => {
              setSiriusModalvisible(true);
            }}
          >
            唤起Modal
          </Button>
        </div>
        <SiriusModal
          visible={siriusModalvisible}
          onCancel={() => {
            setSiriusModalvisible(false);
          }}
          onOk={() => {
            setSiriusModalvisible(false);
          }}
        >
          <p>这是正文</p>
        </SiriusModal>
        <p className={styles.compListTitle}>loading（旧）</p>
        <SearchLoading height={30} text="这是text" />
        <p className={styles.compListTitle}>单选框 Radio（旧）</p>
        <div
          onClick={() => {
            setRadioCheck(!radioCheck);
          }}
        >
          <SiriusRadio checked={radioCheck}>这是个Radio</SiriusRadio>
        </div>
        <p className={styles.compListTitle}>选择器 Select（旧）</p>
        <SiriusSelect defaultValue="lucy" onChange={onSelectChange} label="这是个label" options={selectOptions} />
        <p className={styles.compListTitle}>图标（新）</p>
        <NewIcons />
        <p className={styles.compListTitle}>自定义 hooks（旧）</p>
        <List
          bordered
          dataSource={hooks}
          renderItem={item => (
            <List.Item>
              <div style={{ width: '200px' }}>{item.name}</div>
              <div style={{ flex: '1 1 0' }}>{item.info}</div>
              <div style={{ width: '360px' }}>{item.path}</div>
              <div style={{ width: '200px' }}>{item.author}</div>
            </List.Item>
          )}
        />
        <p className={styles.compListTitle}>svg 图标（旧）</p>
        <Icons />
        {/* <p className={styles.compListTitle}>徽标预览</p> */}
      </div>
    </div>
  );
};
export default CompPreview;
