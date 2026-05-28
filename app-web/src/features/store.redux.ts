import { configureStore } from '@reduxjs/toolkit';
import { PanoramaPreRuleFieldsReducer } from './panorama-pre-rule-fields.feature';

export const store = configureStore({
    reducer: {
        PanoramaPreRuleFields: PanoramaPreRuleFieldsReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;