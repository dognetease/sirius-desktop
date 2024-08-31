import { useState, useEffect } from 'react';
import { apiHolder, apis, AddressBookApi, AddressBookNewApi } from 'api';
import { ICheckboxSelectProps } from '../components/CheckboxSelect';

const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;

type TOptions = ICheckboxSelectProps['options'];

export function useSelectCheckBox(checkedIds: number[] = []) {
  const [options, setOptions] = useState<TOptions>([]);
  const [newOptions, setNewOptions] = useState<TOptions>([]);

  useEffect(() => {
    addressBookNewApi.getAllContactGroupList().then(list => {
      setOptions(
        list.map(el => ({
          id: +el.id,
          label: el.group_name,
          checked: false,
        }))
      );
      updateOptionsByIds(checkedIds);
    });
  }, []);

  const getAllUnCheckedOptions = (options: TOptions) => {
    return options.map(el => {
      return {
        ...el,
        checked: false,
      };
    });
  };

  const unCheckAllOptions = () => {
    setOptions(pre => getAllUnCheckedOptions(pre));
    setNewOptions(pre => getAllUnCheckedOptions(pre));
  };

  const getChangedOptions = (options: TOptions, label: string, checked: boolean) => {
    return options.map(el => {
      if (el.label === label) {
        return {
          ...el,
          checked,
        };
      }
      return el;
    });
  };

  const getAddedOptions = (options: TOptions, label: string, checked: boolean) => {
    return [
      ...options,
      {
        id: 0,
        label,
        checked,
      },
    ];
  };

  const changeCheckState = (label: string, checked: boolean = false) => {
    setOptions(pre => getChangedOptions(pre, label, checked));
    setNewOptions(pre => getChangedOptions(pre, label, checked));
  };

  const addOptions = (label: string, checked: boolean = true) => {
    setOptions(pre => getAddedOptions(pre, label, checked));
    setNewOptions(pre => getAddedOptions(pre, label, checked));
  };

  const addGroupIfNeed: () => Promise<TOptions> = () => {
    return new Promise((resolve, reject) => {
      const addedOptions = newOptions.filter(el => el);
      if (addedOptions.length) {
        addressBookNewApi
          .batchAddGroups({
            groupNames: addedOptions.map(el => el.label),
          })
          .then(resp => {
            const copyOptions = options.slice();
            for (const option of copyOptions) {
              const found = resp.find(el => el.group_name === option.label);
              if (found) {
                option.id = found.id;
              }
            }
            setNewOptions([]);
            setOptions(copyOptions);
            resolve(copyOptions);
          })
          .catch(err => {
            reject(err);
          });
      } else {
        resolve(options);
      }
    });
  };

  const updateOptionsByIds = (checkedIds: number[]) => {
    setOptions(pre => {
      return pre.map(el => {
        const checked = checkedIds.indexOf(+el.id) === -1 ? false : true;
        return {
          ...el,
          checked,
        };
      });
    });
  };

  return {
    options,
    newOptions,
    changeCheckState,
    addOptions,
    unCheckAllOptions,
    addGroupIfNeed,
    updateOptionsByIds,
  };
}
