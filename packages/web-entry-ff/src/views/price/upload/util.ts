export const isPriceError = (value: string) => {
  let prices = value?.split('/');
  let hasError = prices?.some(pirce => !pirce || isNaN(Number(pirce)));
  if (!value || hasError || prices.length < 2 || prices.length > 3) {
    return true;
  }
  return false;
};
