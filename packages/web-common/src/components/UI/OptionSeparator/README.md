# OptionSeparator

![](./usage-1.jpg)

## 用途

用于为操作项之间添加分隔符，常用于表格等场景。

## 参数

| prop | type |
| - | - |
| className | string |
| separator | React.ReactChild |

## 使用

```tsx
import OptionSeparator from '@web-common/components/UI/OptionSeparator';

...

const columns = [
  ...
  {
    ...
    render: () => {
      return (
        <OptionSeparator>
          <span>去处理</span>
          <span>忽略</span>
        </OptionSeparator>
      );
    },
  },
];
```
