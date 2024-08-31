import React from 'react';
import classnames from 'classnames';
import style from './index.module.scss';

interface OptionSeparatorProps {
  className?: string;
  separator?: React.ReactChild;
}

const OptionSeparator: React.FC<OptionSeparatorProps> = props => {
  const { className, separator, children } = props;

  const length = React.Children.count(children);

  return (
    <div className={classnames(style.optionSeparator, className)}>
      {React.Children.map(children, (child, index) => {
        let enhancedChild = child;

        if (React.isValidElement(child)) {
          enhancedChild = React.cloneElement(child as React.ReactElement, {
            className: classnames(child.props.className, style.option),
          });
        }

        return (
          <>
            {enhancedChild}
            {index !== length - 1 ? separator : null}
          </>
        );
      })}
    </div>
  );
};

OptionSeparator.defaultProps = {
  separator: <span className={style.separator} />,
};

export default OptionSeparator;
