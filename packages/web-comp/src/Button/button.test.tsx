// Jest测试框架
// react 测试工具 react-testing-library（官方推荐，默认测试工具）从真是用户的操作来测试，而不是代码逻辑，因为代码逻辑是会变的
// yarn jest ****.test.js 或者  yarn jest ****.test.js --watch
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { expect, jest, describe, it } from 'jest-without-globals';
import Button, { ButtonProps } from './button';
import variables from '../styles/export.module.scss';

const defaultProps = {
  // jest.fn() 模拟函数
  onClick: jest.fn(),
};

const testProps: ButtonProps = {
  btnType: 'primary',
  className: 'klass',
};

const disabledProps: ButtonProps = {
  disabled: true,
  onClick: jest.fn(),
};
// describe(name, fn) 是一个将多个相关的测试组合在一起的块
describe('test Button component', () => {
  // test(name, fn, timeout) 的别名 it(name, fn, timeout) 是将运行测试的方法。
  it('should render the correct default button', () => {
    // render() 渲染组件
    const wrapper = render(<Button {...defaultProps}>Nice</Button>);
    // getByText() 通过文本来选择元素
    const element = wrapper.getByText('Nice') as HTMLButtonElement;
    // expect 断言
    // jest-dom toBeInTheDocument() 文档中是否存在元素
    expect(element).toBeInTheDocument();
    // .toEqual(value) 比较实例的所有属性是否相等
    expect(element.tagName).toEqual('BUTTON');
    // jest-dom toHaveClass(...classNames: string[], options?: {exact: boolean}) 检查给定元素是否在其class属性中有某些类
    expect(element).toHaveClass(`${variables.classPrefix}-btn ${variables.classPrefix}-btn-default`);
    // .toBeFalsy() 布尔值为 false
    expect(element.disabled).toBeFalsy();
    // fireEvent.click(element) 创建一个点击事件并在给定的 DOM 节点上调用该事件
    fireEvent.click(element);
    // toHaveBeenCalled 函数被调用
    expect(defaultProps.onClick).toHaveBeenCalled();
  });
  it('should render the correct component based on different props', () => {
    const wrapper = render(<Button {...testProps}>Nice</Button>);
    const element = wrapper.getByText('Nice');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass(`${variables.classPrefix}-btn-primary klass`);
  });
  it('should render a link when btnType equals link and href is provided', () => {
    const wrapper = render(
      <Button btnType="link" href="http://dummyurl">
        Link
      </Button>
    );
    const element = wrapper.getByText('Link');
    expect(element).toBeInTheDocument();
    expect(element.tagName).toEqual('A');
    expect(element).toHaveClass(`${variables.classPrefix}-btn ${variables.classPrefix}-btn-link`);
  });
  it('should render disabled button when disabled set to true', () => {
    const wrapper = render(<Button {...disabledProps}>Nice</Button>);
    const element = wrapper.getByText('Nice') as HTMLButtonElement;
    expect(element).toBeInTheDocument();
    // .toBeTruthy() 布尔值为 true
    expect(element.disabled).toBeTruthy();
    fireEvent.click(element);
    // .not.toHaveBeenCalled() 函数没有被调用
    expect(disabledProps.onClick).not.toHaveBeenCalled();
  });
});
