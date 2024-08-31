export const getParams = (str: string, name: string) => {
  const reg = new RegExp(`${name}=([^\\?&]+)(?=(&|$))`);
  if (str.match(reg)) {
    return (str.match(reg) as string[])[1];
  }
  return null;
};
