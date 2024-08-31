export const getClientTimezone = () => {
  const oDate = new Date();
  const nTimezone = -oDate.getTimezoneOffset() / 60;
  return nTimezone.toFixed(2).padStart(5, '0');
};
