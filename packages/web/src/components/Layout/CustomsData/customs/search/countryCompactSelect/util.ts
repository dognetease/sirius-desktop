export const getIndeterminateStatus = (allCountryNames: string[], value: string[]) => {
  const countryNamesInValues = value.filter(vl => allCountryNames.includes(vl));
  return countryNamesInValues && countryNamesInValues.length > 0 && countryNamesInValues.length !== allCountryNames.length;
};

export const getCheckStatus = (target: string[], value: string[]) => {
  let checked: boolean = true;
  for (let index = 0; index < target.length; index++) {
    const countryName = target[index];
    checked = checked && value.includes(countryName);
  }
  return checked;
};
