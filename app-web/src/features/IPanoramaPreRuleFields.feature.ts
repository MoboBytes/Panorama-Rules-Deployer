import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction} from '@reduxjs/toolkit';
import type { IPanoramaPreRuleFields } from '../contracts/IPanoramaPreRuleFields';

interface IInitialState {
    TrackerPanorama: IPanoramaPreRuleFields;
}

const initialState: IInitialState = {
    TrackerPanorama: {
        RuleName: '',
        ProfileSetting: '',
        To: '',
        From: '',
        Source: '',
        Destination: '',
        Application: '',
        Service: '',
        GroupTag: '',
        Tag: '',
        Action: 'Allow',
        LogSetting: '',
        LogStart: '',
        LogEnd: 'yes',
        Description: '',
        DeviceGroup: '',
        Requester: '',
        TicketNumber: '',
        SourceName: '',
        DestinationName: ''
    }
};

const PanoramaPreRuleFieldsSlice = createSlice({
    name: 'panoramaPreRuleFields',
    initialState: initialState,
    reducers: {
        SetPanoramaPreRuleFields: (state, action: PayloadAction<IPanoramaPreRuleFields>) => {
            state.TrackerPanorama = action.payload;
        }
    }
});

export const PanoramaPreRuleFieldsAction = PanoramaPreRuleFieldsSlice.actions;
export const PanoramaPreRuleFieldsReducer = PanoramaPreRuleFieldsSlice.reducer;