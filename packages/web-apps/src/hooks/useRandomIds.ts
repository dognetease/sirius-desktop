import React from 'react';

export const genRandomId = () => {
  return `${Date.now()}-${Math.random()}`;
};

export const useRandomIds = (count: number) => {
  const [ids, setIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    const newIds = [];
    for (let i = 0; i < count; i++) {
      newIds.push(`${Date.now()}-${Math.random()}`);
    }
    setIds(newIds);
  }, [count]);
  return ids;
};
