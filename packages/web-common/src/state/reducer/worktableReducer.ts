import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment';
import { ResEmailPanel, ResCustomerPanel, ResFollowsPanel, ResSchedulePanel, WorktableApi, api, ResEdmPanel, ResEmailInquirySwitch } from 'api';

export type PanelKeys =
  | 'myEmail'
  | 'myEdm'
  | 'allEdm'
  | 'myCustomer'
  | 'allCustomer'
  | 'schedule'
  | 'knowledgeList'
  | 'timeZoneWithRate'
  | 'employeeRankCard'
  | 'todoCard'
  | 'popularCourse'
  | 'systemTask'
  | 'myCustomerStage'
  | 'teamCustomerStage'
  | 'systemUsageOverview'
  | 'forwardEmailInquiry';
const worktableApi = api.requireLogicalApi('worktableApiImpl') as WorktableApi;

export const ALL_PANEL_KEYS: PanelKeys[] = [
  'forwardEmailInquiry',
  'employeeRankCard',
  'allCustomer',
  'allEdm',
  'myCustomer',
  'myEmail',
  'systemTask',
  'schedule',
  'knowledgeList',
  'timeZoneWithRate',
  'todoCard',
  'systemUsageOverview',
];

export interface Filters {
  start_date: string;
  end_date: string;
  account_id_list?: string[];
  company_level?: string[];
  star_level?: string[];
  page?: number;
  page_size?: number;
  is_desc?: boolean;
  order_by?: string;
}

export interface WorktableCardState {
  loading: boolean;
  filters: Filters;
  showModal: boolean;
}

export interface WorktableReducer {
  myEmail: WorktableCardState & { data?: ResEmailPanel };
  myEdm: WorktableCardState & { data?: ResEdmPanel };
  allEdm: WorktableCardState & { data?: ResEdmPanel };
  myCustomer: WorktableCardState & { data?: ResCustomerPanel };
  allCustomer: WorktableCardState & { data?: ResCustomerPanel };
  myCustomerFollows: WorktableCardState & { data?: ResFollowsPanel };
  allCustomerFollows: WorktableCardState & { data?: ResFollowsPanel };
  schedule: WorktableCardState & { data?: ResSchedulePanel };
  emailInquirySwitch: WorktableCardState & { data?: ResEmailInquirySwitch };
}
const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYY-MM-DD'),
  end_date: moment().endOf('month').format('YYYY-MM-DD'),
};
const initState: WorktableReducer = {
  myEmail: {
    loading: false,
    showModal: false,
    filters: defaultDateRange,
  },
  myEdm: {
    loading: false,
    showModal: false,
    filters: defaultDateRange,
  },
  allEdm: {
    loading: false,
    showModal: false,
    filters: defaultDateRange,
  },
  myCustomer: {
    loading: false,
    showModal: false,
    filters: defaultDateRange,
  },
  allCustomer: {
    loading: false,
    showModal: false,
    filters: defaultDateRange,
  },
  myCustomerFollows: {
    loading: false,
    showModal: false,
    filters: {
      ...defaultDateRange,
      page: 1,
      page_size: 10,
    },
  },
  allCustomerFollows: {
    loading: false,
    showModal: false,
    filters: {
      ...defaultDateRange,
      page: 1,
      page_size: 10,
    },
  },
  schedule: {
    loading: false,
    showModal: false,
    filters: {
      ...defaultDateRange,
      page: 1,
      page_size: 10,
    },
  },
  emailInquirySwitch: {
    loading: false,
    showModal: false,
    filters: defaultDateRange,
  },
};

export const getMyEmailsPanelAsync = createAsyncThunk('getMyEmailsPanelAsync', (filter: Filters) => {
  return worktableApi.getEmailPanel(filter);
});

export const getMyEdmPanelAsync = createAsyncThunk('getMyEdmPanelAsync', (filter: Filters) => {
  return worktableApi.getEdmPanel(filter);
});

export const getAllEdmPanelAsync = createAsyncThunk('getAllEdmPanelAsync', (filter: Filters) => {
  return worktableApi.getAllEdmPanel(filter);
});

export const getMyCustomerPanelAsync = createAsyncThunk('getMyCustomerPanelAsync', async (filter: Filters) => {
  return worktableApi.getCustomerPanel(filter);
});

export const getAllCustomerPanelAsync = createAsyncThunk('getAllCustomerPanelAsync', async (filter: Filters) => {
  return worktableApi.getAllCustomerPanel(filter);
});

export const getFollowsPanelAsync = createAsyncThunk('getFollowsPanelAsync', (filter: Filters) => {
  return worktableApi.getFollowsPanel(filter);
});

export const getAllFollowsPanelAsync = createAsyncThunk('getAllFollowsPanelAsync', (filter: Filters) => {
  return worktableApi.getAllFollowsPanel(filter);
});

export const getSchedulePanelAsync = createAsyncThunk('getSchedulePanelAsync', (filter: Filters) => {
  return worktableApi.getSchedulePanel(filter);
});

export const getEmailInquirySwitchAsync = createAsyncThunk('getEmailInquirySwitchAsync', () => {
  return worktableApi.getEmailInquirySwitch();
});

interface FilterPayload {
  panelKey: PanelKeys;
  filters: Partial<Filters>;
}

const worktableSlicer = createSlice({
  name: 'worktableReducer',
  initialState: initState,
  reducers: {
    showModal: (state, action: PayloadAction<PanelKeys>) => {
      state[action.payload].showModal = true;
    },
    closeModal: (state, action: PayloadAction<PanelKeys>) => {
      state[action.payload].showModal = false;
    },

    setFilter: (state, action: PayloadAction<{ panelKey: PanelKeys; filters: Filters }>) => {
      state[action.payload.panelKey].filters = action.payload.filters;
    },
    updateFilter: (state, action: PayloadAction<FilterPayload>) => {
      const oldFilters = state[action.payload.panelKey].filters;
      state[action.payload.panelKey].filters = {
        ...oldFilters,
        ...action.payload.filters,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMyEmailsPanelAsync.pending, state => {
        state.myEmail.loading = true;
      })
      .addCase(getMyEmailsPanelAsync.fulfilled, (state, action) => {
        state.myEmail.loading = false;
        state.myEmail.data = action.payload;
      })
      .addCase(getMyEmailsPanelAsync.rejected, state => {
        state.myEmail.loading = false;
      });

    builder
      .addCase(getMyEdmPanelAsync.pending, state => {
        state.myEdm.loading = true;
      })
      .addCase(getMyEdmPanelAsync.fulfilled, (state, action) => {
        state.myEdm.loading = false;
        state.myEdm.data = action.payload;
      })
      .addCase(getMyEdmPanelAsync.rejected, state => {
        state.myEdm.loading = false;
      });

    builder
      .addCase(getAllEdmPanelAsync.pending, state => {
        state.allEdm.loading = true;
      })
      .addCase(getAllEdmPanelAsync.fulfilled, (state, action) => {
        state.allEdm.loading = false;
        state.allEdm.data = action.payload;
      })
      .addCase(getAllEdmPanelAsync.rejected, state => {
        state.allEdm.loading = false;
      });

    builder
      .addCase(getMyCustomerPanelAsync.pending, state => {
        state.myCustomer.loading = true;
      })
      .addCase(getMyCustomerPanelAsync.fulfilled, (state, action) => {
        state.myCustomer.loading = false;
        state.myCustomer.data = action.payload;
      })
      .addCase(getMyCustomerPanelAsync.rejected, state => {
        state.myCustomer.loading = false;
      });

    builder
      .addCase(getAllCustomerPanelAsync.pending, state => {
        state.allCustomer.loading = true;
      })
      .addCase(getAllCustomerPanelAsync.fulfilled, (state, action) => {
        state.allCustomer.loading = false;
        state.allCustomer.data = action.payload;
      })
      .addCase(getAllCustomerPanelAsync.rejected, state => {
        state.allCustomer.loading = false;
      });

    builder
      .addCase(getFollowsPanelAsync.pending, state => {
        state.myCustomerFollows.loading = true;
      })
      .addCase(getFollowsPanelAsync.fulfilled, (state, action) => {
        state.myCustomerFollows.loading = false;
        state.myCustomerFollows.data = action.payload;
      })
      .addCase(getFollowsPanelAsync.rejected, state => {
        state.myCustomerFollows.loading = false;
      });

    builder
      .addCase(getAllFollowsPanelAsync.pending, state => {
        state.allCustomerFollows.loading = true;
      })
      .addCase(getAllFollowsPanelAsync.fulfilled, (state, action) => {
        state.allCustomerFollows.loading = false;
        state.allCustomerFollows.data = action.payload;
      })
      .addCase(getAllFollowsPanelAsync.rejected, state => {
        state.allCustomerFollows.loading = false;
      });

    builder
      .addCase(getSchedulePanelAsync.pending, state => {
        state.schedule.loading = true;
      })
      .addCase(getSchedulePanelAsync.fulfilled, (state, action) => {
        state.schedule.loading = false;
        state.schedule.data = action.payload;
      })
      .addCase(getSchedulePanelAsync.rejected, state => {
        state.schedule.loading = false;
      });

    builder
      .addCase(getEmailInquirySwitchAsync.pending, state => {
        state.emailInquirySwitch.loading = true;
      })
      .addCase(getEmailInquirySwitchAsync.fulfilled, (state, action) => {
        state.emailInquirySwitch.loading = false;
        state.emailInquirySwitch.data = action.payload;
      })
      .addCase(getEmailInquirySwitchAsync.rejected, state => {
        state.emailInquirySwitch.loading = false;
      });
  },
});

export const { actions } = worktableSlicer;
export default worktableSlicer.reducer;
