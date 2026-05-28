import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction} from '@reduxjs/toolkit';
import type { IPanoramaPreRuleFields } from '../contracts/panorama-pre-rule-fields.contract';

interface IInitialState {
    PanoramaPreRuleFields: IPanoramaPreRuleFields;
}

const initialState: IInitialState = {
    PanoramaPreRuleFields: {
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
        Action: '',
        LogSetting: '',
        Description: '',
        DeviceGroup: '',
        Before: ''
    }
};

const PanoramaPreRuleFieldsSlice = createSlice({
    name: 'panoramaPreRuleFields',
    initialState: initialState,
    reducers: {
        SetPanoramaPreRuleFields: (state, action: PayloadAction<IPanoramaPreRuleFields>) => {
            state.PanoramaPreRuleFields = action.payload;
        }
    }
});

export const PanoramaPreRuleFieldsAction = PanoramaPreRuleFieldsSlice.actions;
export const PanoramaPreRuleFieldsReducer = PanoramaPreRuleFieldsSlice.reducer;