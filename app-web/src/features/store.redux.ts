import { configureStore } from '@reduxjs/toolkit';
import { PanoramaPreRuleFieldsReducer } from './IPanoramaPreRuleFields.feature';

export const store = configureStore({
    reducer: {
        PanoramaPreRuleFields: PanoramaPreRuleFieldsReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;