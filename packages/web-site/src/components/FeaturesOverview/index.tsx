import React from 'react';
import styles from './index.module.scss';

import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as ModalCloseBtn } from '@/images/icons/modal-close-btn.svg';
import { getIn18Text } from 'api';

interface FeaturesOverviewProps {
  visible: boolean;
  onClose: () => void;
}

export const FeaturesOverview: React.FC<FeaturesOverviewProps> = props => {
  const list = [
    {
      name: 'AI智能建站',
      content: [
        {
          title: 'AI 建站',
          desc: '基于公司所在的行业/商品等信息，AI智能生成企业专属的站点框架和图文描述，大大降低企业建站的时间和人力成本',
        },
        {
          title: 'AI修改图文',
          desc: '输入AI指令调整单个图片/文字的内容，让AI助力完成图片的设计和文案编写工作，提高站点的内容质量。',
        },
        {
          title: 'AI 配置SEO',
          desc: '借助公司已有的介绍和商品信息，AI自动生成SEO所需的Title、Keyword、Detil等字段信息，专业高效提高搜索质量。',
        },
      ],
    },
    {
      name: '建站管理',
      content: [
        {
          title: '精选模板',
          desc: '覆盖60+行业的精选模板，随心选择喜欢的样式，一键开启站点搭建工作。支持基于模板框架二次调整内容，帮助企业快速建站。',
        },
        {
          title: '站点页面',
          desc: '最多可创建100个页面，借助页面层级结构和布局，方便企业宣传公司和商品。',
        },
        {
          title: '丰富组件',
          desc: '提供多样化的模块和组件，包含动效组件，可随心搭配样式，搭建高质量、美观的站点。',
        },
        {
          title: '50G服务空间	',
          desc: '最大50G服务存储空间，安全存储公司的图片、视频等所有信息。',
        },
        {
          title: '域名绑定',
          desc: '支持修改为自定义域名，同样支持多域名绑定，完全满足站点的推广需求。',
        },
        {
          title: '多端适配',
          desc: '自动适配PC、移动端等多端的客户浏览体验，提高访问时长和留资率。',
        },
        {
          title: 'SEO配置',
          desc: '配置站点信息，自动生成站点Sitemap，加快搜索引擎收录。',
        },
        {
          title: 'CDN全球加速',
          desc: '全球服务节点智能匹配，保证全球任何方位的客户无障碍访问。',
        },
      ],
    },
    {
      name: '商品管理',
      content: [
        {
          title: '商品数量500个',
          desc: '最多可添加500个商品信息，自定义展示商品分类和顺序',
        },
        {
          title: '商品插件',
          desc: '快速迁移第三方平台的商品信息，一键迁移，无需重复操作',
        },
        {
          title: '商品管理',
          desc: '管理商品的分组、上下下线等操作；',
        },
        {
          title: '成本价销售价',
          desc: '支持配饰商品的成本价和销售价，满足内部记录和外部展示的各种场景需求。',
        },
        {
          title: '第三方链接',
          desc: '支持添加外部第三方商品链接，打通外部的销售和成单能力。',
        },
        {
          title: '多语言翻译',
          desc: '自动翻译建站的销售价和介绍内容，无障碍适配多语言的页面展示。',
        },
      ],
    },
    {
      name: '数据分析',
      content: [
        {
          title: '数据看板',
          desc: '详细数据统计面板，概览站点全部数据，支持查看',
        },
        {
          title: '客户行为数据',
          desc: '客户访问页面/时长/国家等数据统计',
        },
        {
          title: '数据对比',
          desc: '不同页面的访客率/询盘率等数据统计',
        },
        {
          title: '商品数据',
          desc: '商品访问热度等数据统计',
        },
      ],
    },
    {
      name: '询盘管理',
      content: [
        {
          title: '询盘管理及编辑',
          desc: '客户的统一管理和增删改查',
        },
        {
          title: '客户标签及分类',
          desc: '支持给客户打标签，方便查找和筛选',
        },
      ],
    },
    {
      name: '业务打通',
      content: [
        {
          title: '邮件营销插入商品',
          desc: '在邮件营销中支持插入站点商品',
        },
        {
          title: '普通邮件插入商品',
          desc: '在普通邮件中支持插入站点商品',
        },
        {
          title: '数据统计',
          desc: '基于客户单人精准统计数据',
        },
        {
          title: '自动化营销',
          desc: '基于客户的点击行为，自动进行多轮营销',
        },
      ],
    },
    {
      name: '营销推广',
      content: [
        {
          title: 'SEM营销',
          desc: '支持站点在搜索引擎投放',
        },
        {
          title: '社媒营销',
          desc: '支持站点在社媒渠道投放',
        },
      ],
    },
    {
      name: '附加权益',
      content: [
        {
          title: '赠送域名',
          desc: '免费赠送站点域名',
        },
        {
          title: '赠送证书',
          desc: '免费赠送https证书',
        },
        {
          title: getIn18Text('ZHANDIANBEIAN'),
          desc: getIn18Text('DATONGBEIANLIUCHENG，FANGBIANKUAIJIEJIESHENGSHIJIAN'),
        },
      ],
    },
    {
      name: '售后服务',
      content: [
        {
          title: '专属客服经理',
          desc: '1V1陪伴式服务，快速响应，专业细致',
        },
        {
          title: '持续升级',
          desc: '功能持续更新，敬请期待',
        },
      ],
    },
  ];

  return (
    <Modal
      visible={props.visible}
      getContainer={false}
      width={468}
      title="建站功能清单"
      maskClosable={false}
      className={styles.featuresOverview}
      destroyOnClose={true}
      okText={getIn18Text('ZHIDAOLE')}
      onOk={props.onClose}
      onCancel={props.onClose}
      closeIcon={<ModalCloseBtn />}
    >
      <div className={styles.features}>
        {list.map(feature => (
          <div className={styles.featuresTr}>
            <div className={styles.featuresTrLeft}>{feature.name}</div>
            <div className={styles.featuresTrRight}>
              {feature.content.map(item => (
                <div className={styles.featuresTrRightTd}>
                  <div className={styles.featuresTrRightTdTitle}>{item.title}</div>
                  <div className={styles.featuresTrRightTdDesc}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
