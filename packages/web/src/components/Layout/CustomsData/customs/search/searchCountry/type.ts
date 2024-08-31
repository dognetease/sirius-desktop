export type TreeNode = {
  parent?: TreeNode | null;
  countries?: TreeNode[];
  code: string;
  label: string;
  showBox: boolean;
};

export interface resCustomsCountry {
  label: string;
  code: string;
}

export interface countryItemType {
  state: string;
  code: string;
  countries: resCustomsCountry[];
}

export const All = '$All';
