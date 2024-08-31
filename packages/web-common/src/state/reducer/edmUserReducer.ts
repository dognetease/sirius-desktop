import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiHolder, apis, ContactApi, ContactModel, EdmRoleApi, EntityOrg, MEMBER_TYPE, OrgApi, OrgModel } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const roleApi = apiHolder.api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

export interface EdmUserState {
  orgData: OrgModel | null;
  // { [org.originId] : true... }
  // 有EDM权限的部门（组织），例如：A - B - C - D,树结构，如果B部门有权限，C D也将被加入到map中
  orgIds: Record<string, boolean>;
  // { [contact.originId]: true...}, 有EDM权限的用户
  contactIds: Record<string, boolean>;
  loading: boolean;
  ready: boolean;
}

const initState: EdmUserState = {
  orgData: null,
  orgIds: {},
  contactIds: {},
  loading: false,
  ready: false,
};

export const getEdmUserTreeAsync = createAsyncThunk('getEdmUsers/tree', async () => {
  return Promise.all([
    contactApi.doGetContactOrg({
      orgId: undefined,
    }),
    roleApi.getEdmAccount().then(data => {
      return data.members;
    }),
  ]).then(([orgData, members]) => {
    const visilbeOrg = members.filter(i => i.memberType === MEMBER_TYPE.ORG).map(i => i.memberAccId);
    const contactIds: Record<string, boolean> = {};
    const contactIdList = members.filter(i => i.memberType === MEMBER_TYPE.ACC).map(i => i.memberAccId);
    return contactApi.doGetContactById(contactIdList).then(async contacts => {
      const { tree, orgIds } = buildOrgTree(orgData, contacts, visilbeOrg);
      console.log('rbac', orgData, tree, orgIds);
      // 组织下的所有人
      const arrOrgIds = Object.keys(orgIds);
      const ids =
        arrOrgIds.length > 0
          ? await contactApi.doGetContactByOrgId({ orgId: Object.keys(orgIds) }).then(contacts => contacts.map(contact => contact.contact.accountOriginId))
          : [];
      [...ids, ...contactIdList].forEach(id => id && (contactIds[id] = true));
      return {
        tree,
        orgIds,
        contactIds,
      };
    });
  });
});

const edmUserSlice = createSlice({
  name: 'edmUserReducer',
  initialState: initState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getEdmUserTreeAsync.pending, state => {
        state.loading = true;
      })
      .addCase(getEdmUserTreeAsync.fulfilled, (state, action) => {
        state.orgData = action.payload.tree;
        state.orgIds = action.payload.orgIds;
        state.contactIds = action.payload.contactIds;
        state.ready = true;
        state.loading = false;
      })
      .addCase(getEdmUserTreeAsync.rejected, state => {
        state.loading = false;
      });
  },
});

export const hasEdmPermission = (state: EdmUserState, contact: ContactModel) => {
  contact.contact.position;
};

export const edmUserActions = edmUserSlice.actions;
export default edmUserSlice.reducer;

function buildOrgTree(orgData: OrgModel, contacts: ContactModel[], visibleOrgs: string[]) {
  const root = orgData.org;

  if (visibleOrgs.indexOf(root.originId) !== -1) {
    // 先中根目录，所有组织都可以被选中
    const idMap: Record<string, boolean> = {};
    orgData.orgList.forEach(i => (idMap[i.originId] = true));
    return {
      tree: orgData,
      orgIds: idMap,
    };
  }

  const set = new Set<string>(visibleOrgs);
  contacts.forEach(c => {
    c.contact.position?.forEach(pos => {
      const ids = getOrgIdByName(orgData.children, pos);
      if (ids === null) {
        console.warn('parseError', pos);
        return;
      }
      ids.forEach(id => set.add(id));
    });
  });
  const orgList = orgData.orgList.filter(org => set.has(org.originId));

  return {
    tree: orgListToTree(orgList, root),
    orgIds: getSubTreeIds(orgData.orgList, visibleOrgs),
  };
}

function getOrgIdByName(tree: OrgModel[], path: string[]) {
  const ret: string[] = [];
  let level = tree;
  for (let i = 0, l = path.length; i < l; i++) {
    const org = level.find(item => item.org.orgName === path[i]);
    if (org) {
      ret.push(org.org.originId);
      level = org.children;
    } else {
      return null;
    }
  }
  return ret;
}

function getSubTreeIds(orgList: EntityOrg[], ids: string[]) {
  const idMap: Record<string, boolean> = {};
  const map: Record<string, string[]> = {};
  const mapParnet: Record<string, string> = {};
  orgList.forEach(org => {
    mapParnet[org.id] = org.originId;
  });
  orgList.forEach(org => {
    const parentOriginId = mapParnet[org.parent] || org.parent;
    map[parentOriginId] = map[parentOriginId] || [];
    map[parentOriginId].push(org.originId);
  });
  ids.forEach(id => {
    idMap[id] = true;
    const childIds = map[id];
    childIds?.forEach(childId => (idMap[childId] = true));
  });
  return idMap;
}

function orgListToTree(orgList: EntityOrg[], root: EntityOrg) {
  const orgData: OrgModel = {
    children: [],
    org: root,
    orgList,
  };
  const map: Record<string, OrgModel> = {};
  map[root.id] = orgData;
  orgList.forEach(entityOrg => {
    if (!map[entityOrg.id]) {
      const item = (map[entityOrg.id] = {
        children: [],
        org: entityOrg,
        orgList: [],
      });
      if (map[entityOrg.parent]) {
        map[entityOrg.parent].children.push(item);
        map[entityOrg.parent].orgList.push(entityOrg);
      }
    }
  });
  return orgData;
}
