# 参考文档
https://docs.popo.netease.com/lingxi/68eda934e7ab4b1180d0c9a9dd63619d#d4K3-1695720339411

# 使用说明
1. 从这里 import 抽屉组件：packages/web/src/components/Layout/CustomsData/components/uniDrawer/index.ts（为了统一调用 setUpL2cConf 和 setHttpConfig）
2. 不要再使用 packages/web/src/components/Layout/CustomsData/components/uniDrawer/uniDrawer.tsx 里面的代码（老代码没删干净是因为线上场景回归不完全可控）
3. 各个模块的开发同学注意下文件的命名规范和场景是否通用
    1. 比如 uniDrawerLeads2.tsx 的命名，这个文件和抽屉没啥关系，里面的部分代码可能也没有封装的必要
    2. 如果不通用其实可以移到自己模块下面进行二次封装
4. 之前抽屉相关的端上打点也移到 npm 里面去了，比如客户和联系人 biz_interact_external_detail_iframe 的打点


# 倒叙备注 unidrawer 演变的历史

1. 0915 之后的当前版本，为了改变 0422 版本的痛点
    1. 把当前主站内的代码搬到了 crm 内部，基础逻辑没有大变，也保留了 showUnidrawer 方法
    2. l2c-crm 以后只维护 npm 内部代码，不会再在 sirius-desktop 里面做代码修改了，如果主站的同学有需要，可以各自进行二次封装
    3. npm 包 export 出来了各种定义，除了表单的数据内外对不上（主站各个模块的数据基本上是 l2c-crm 的子集，可以参考后 as any 处理），其他参数尽量不要再使用 any

2. 0422~0915，l2c-crm 转为 npm 包的形式，npm 包对外 export 了基础组件
    1. 正因为暴露的只是基础组件，所以在主站根据每个开发的各自喜好，有了进一步的封装，比如支持 7 种抽屉的 unidrawer，支持通过函数调用唤起所有抽屉的 showUnidrawer 方法
    2. 主站内的代码分工不明确，如果多个模块都有新增抽屉需求时，各个模块害怕冲突都不敢去改之前的代码，要么只能靠复制代码联调提测，要么就是各自增加新的组件
    3. 因为打包的问题，没有对外暴露 crm 的 interface 以及 type 等定义

3. 0422 之前的最初版本，crm 项目是基于 uni 通过 iframe 做的集成，抽屉也是使用 iframe 加载的（路由区分）