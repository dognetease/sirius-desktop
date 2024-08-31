# virtual-table

基于`antd table`原生属性`components`开发的虚拟列表组件，支持大多数表格原生功能。同时支持自动切换渲染模式，最大限度兼容性能和体验～

## 基础用法

```jsx
<VirtualTable
  pagination ={false}
  rowSelection={{
    type: 'checkbox',
  }}
  columns={columns}
  dataSource={createData(500)}
  autoSwitchRenderMode={true}
  enableVirtualRenderCount={50}
  scroll={{ y: 300 }}
/>
```

## Q&A：和官网基于`react-window`实现的虚拟列表有什么区别？

基于`react-window`的实现方式相当于是自己渲染表格的列表内容区，最大的问题是基本上绝大多数的表格原生功能都支持不了，比如“排序”，“全选”等等。如果要自己实现，会非常复杂，相当于自己写了个antd table。

而基于`components`，使用**原生节点**渲染表格，相当于还是用的antd的表格组件，仅仅是加入了虚拟列表渲染的能力。这种方式最大程度保留了antd表格的原生能力。

## Q&A：推荐的使用场景？

虚拟列表最大的优点就是在渲染大数据量时可以**极大的节省DOM渲染时间和内存占用**。

相应的缺点就是因为只渲染了部分列表，所以在快速滚动时会不如全渲染的列表流畅，滚动过快会出现白块。

该组件在实现的过程中也考虑到这个问题，所以开放了`autoSwitchRenderMode`和`enableVirtualRenderCount`两个属性，支持自定义在数据量达到什么量级时使用虚拟列表渲染，在达不到这个量级时使用常规模式渲染。

所以不需要纠结该用哪个组件，如果可能会遇到大数据量的业务场景，都推荐使用该组件。

注意：目前只支持固定行高的情况。

## Q&A：支持哪些功能？

目前的实现方式，props会透传给原生表格组件，所以原生组件支持的属性和方式，现在也支持。

除此之外，支持自定义切换渲染模式：

- autoSwitchRenderMode: true/false。是否开启自动切换渲染模式。如果设置为false，会强制使用普通模式渲染

- enableVirtualRenderCount: number。在开启`autoSwitchRenderMode`的前提下，组件内部会将当前表格数据量与该值进行比较，大于等于该值时开启虚拟列表渲染。如果希望强制开启虚拟列表渲染，可以将该值设置为0。

## Q&A：rowHeight属性是必须的么？

这个属性在表格初始渲染被设置为`display:none`的情况下是必须的。因为在`display: none`的情况下，表格数据并没有被真实渲染，这时候获取表格的行高是**获取不到的**。所以会导致表格高度丢失的问题。这种情况下需要手动指定`rowHeight`。

除此之外，应该是不需要手动设置行高的。（不排除存在其他未考虑的情况，可以把设置`rowHeight`作为兜底策略）。

## Q&A：使用上的限制情况

- 首先是行高必须是统一的，因为表格的高度计算是**行数x行高**。
- 表格不能设置`scroll: {x: 'max-content'}`。这会导致不设置列宽的列在数据很长时撑开表格。会出现列宽动态变化的情况。会影响用户使用体验
