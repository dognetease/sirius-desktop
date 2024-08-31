# useResponsiveTable

## 背景

常见一种场景：表格内容区铺满页面剩余高度。

项目中太多此类场景，使用 `calc(100vh - ???px)` 处理。

常出现计算不准确，导致出现滚动条；或者外部布局改变时，需要再次调整 `calc` 值。

## 目的

更优雅地，提供处理页面 100% 高度布局时，表格自适应剩余高度的能力。

## 使用

```tsx
import { useResponsiveTable } from '@/hooks/useResponsiveTable';

const { layout, growRef, scrollY } = useResponsiveTable();

<div className={layout.container}>
  <div className={layout.static} />
  <div className={layout.grow} ref={growRef}>
    <Table scroll={{ y: scrollY }} />
  </div>
</div>
```

## 原理

此 hook 返回三个变量：

| 变量 | 用途 |
| - | - |
| layout | CSS 变量，提供布局能力 (`layout` 下的类名支持嵌套) |
| └─ layout.container | 提供垂直方向 100% 的 flex 容器 |
| └─ layout.static | 提供不跟随容器高度改变的静态容器 |
| └─ layout.grow | 提供跟随容器高度自适应高度的容器 |
| growRef | 绑定该 `ref` 到 `layout.grow`，以订阅其高度改变 |
| scrollY | 绑定到 `antd.table.scroll.y`，由 `growRef` 计算得到 |
