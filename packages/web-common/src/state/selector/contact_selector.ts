import { useAppSelector } from '@web-common/state/createStore';
import { ContactModel } from 'api';
import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { RootState } from '@web-common/state/createStore';

export type SelectContactModelByIdsFunc = (ids: (string | undefined)[]) => ContactModel[];

export const selectContactSelector = (state: RootState) => state.contactReducer.contactMap;

export const wrTemplateContactChooserSelector = (state: RootState) => state.tempContactReducer.selector;

export const wrContactChooserSelector = (state: RootState) => state.contactReducer.selector;

const selectByIds = (ids: (string | undefined)[]) =>
  createDraftSafeSelector([selectContactSelector], (state: Record<string, ContactModel>) => {
    const ret: ContactModel[] = [];
    if (ids && ids.length > 0) {
      ids.forEach(id => {
        if (id) {
          const item = state[id];
          if (item) ret.push(item);
        }
      });
    }
    console.log('trans result of contactItem in teamCreator ', ret);
    return ret;
  });

export const useSelectContactModelByIdsFunc: SelectContactModelByIdsFunc = (ids: (string | undefined)[]) => {
  return useAppSelector(selectByIds(ids));
};
