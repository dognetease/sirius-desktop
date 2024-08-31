import React from 'react';
import './index.scss';
import Link from '@web-common/components/UI/Icons/svgs/Link';

export interface AttachmentIconProps {
  currentLength: number;
}

export interface AttachmentIconState {
  isShow: boolean;
  scrollDom: HTMLElement;
  attachmentListDom: HTMLElement;
  contentObserver: MutationObserver;
  scrollTimer: NodeJS.Timer | null;
}

class AttachmentIcon extends React.PureComponent<AttachmentIconProps, AttachmentIconState> {
  constructor(props: AttachmentIconProps) {
    super(props);
    this.state = {
      isShow: false,
      scrollDom: document.getElementById('writeMailEditorScroll') as HTMLElement,
      attachmentListDom: {} as HTMLElement,
      contentObserver: {} as MutationObserver,
      scrollTimer: null,
    };
    this.bindHandleScroll = this.bindHandleScroll.bind(this);
    this.attachmentClick = this.attachmentClick.bind(this);
  }

  componentDidMount() {
    const { scrollDom } = this.state;
    this.setState({ attachmentListDom: document.querySelector('.attachment .attachment-list') as HTMLElement }); // 获取附件dom
    scrollDom.addEventListener('scroll', this.bindHandleScroll); // 监听滚动
    this.createObserver(); // 监听content更新
  }

  componentWillUnmount() {
    const { scrollDom, contentObserver } = this.state;
    scrollDom.removeEventListener('scroll', this.bindHandleScroll); // 销毁滚动监听
    contentObserver.disconnect(); // 销毁content更新监听
  }

  bindHandleScroll() {
    const { scrollDom, scrollTimer, attachmentListDom } = this.state;
    if (scrollTimer) {
      return;
    }
    this.setState({
      scrollTimer: setTimeout(() => {
        const num = scrollDom.getBoundingClientRect().bottom - attachmentListDom.getBoundingClientRect().top;
        if (num > 0) {
          this.setState({ isShow: false });
        } else {
          this.setState({ isShow: true });
        }
        this.setState({ scrollTimer: null });
      }, 100),
    });
  }

  private createObserver() {
    const config = { childList: true, subtree: true };
    this.setState({ contentObserver: new MutationObserver(this.bindHandleScroll) }, () => {
      const { contentObserver, scrollDom } = this.state;
      contentObserver.observe(scrollDom, config);
    });
  }

  attachmentClick() {
    // 计算滚动距离
    const { scrollDom } = this.state;
    const scrollTopDist: number = document.querySelectorAll('.editor-container')[0].getBoundingClientRect().height;
    scrollDom.scrollTo(0, scrollTopDist);
  }

  render() {
    const { isShow } = this.state;
    const { currentLength } = this.props;
    return (
      <div className="attachment-icon" style={{ display: isShow ? 'flex' : 'none' }} onClick={this.attachmentClick}>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <Link stroke="#386EE7" width="18px" height="18px" />
        <span>{currentLength}</span>
      </div>
    );
  }
}

export default AttachmentIcon;
