/**
 * 数据组合
 */
import ChatEditorHeight from './list/chatEditorHeight';
import { Provider as EdisklinkProvider } from './list/edisklinks';
import { Provider as SaveDraftProvider } from './list/saveDraftBeforeDestroy';

const providers = [SaveDraftProvider, ChatEditorHeight.Provider, EdisklinkProvider];

export default providers;
