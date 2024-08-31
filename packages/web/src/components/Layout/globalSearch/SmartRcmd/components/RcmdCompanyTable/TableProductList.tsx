import { ICompanySubFallItem } from 'api';
import React from 'react';
import styles from './rcmdcompanytable.module.scss';
import classNames from 'classnames';

interface TableProductList<T = ICompanySubFallItem> {
  item: T;
}

export default ({ item: { productList } }: TableProductList) => {
  if (!productList || productList.length === 0) {
    return null;
  }
  return (
    <div className={styles.productList}>
      {productList.map((prod, index) => (
        <div key={index} className={styles.productItem}>
          <div
            className={styles.productImage}
            style={{
              backgroundImage: `url(${prod.imgUrl})`,
            }}
          ></div>
          {/* <div
            className={classNames(styles.productIntro)}
          >
            <p className={styles.text}>{prod.name}</p>
            <p className={styles.text}>{prod.price}</p>
          </div> */}
        </div>
      ))}
    </div>
  );
};
