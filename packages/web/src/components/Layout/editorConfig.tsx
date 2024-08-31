import { RawEditorSettings } from '@web-common/tinymce';
import { apiHolder as api, apis, DataTrackerApi, SystemApi, inWindow, DEFAULT_LANG, Lang, conf as config } from 'api';
import juice from 'juice';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { handleCopyImg } from '@web-mail/components/ReadMail/util';
import { actions } from '@web-common/state/reducer/mailReducer';
import { getIn18Text } from 'api';

const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const contextPath = config('contextPath') as string;
// const storeApi: DataStoreApi = api.api.getDataStoreApi();
const tinyStyle = 'body {margin: 0; font-size: 14px;}';
// 需要在发信时带上的样式
// 给没有边框的表格加上边框
const defaultStyle = `
    body {line-height: 1.5;}
  a { text-decoration:none; color: #386ee7; cursor: pointer; }
  table { border-collapse: collapse; }
`;

const env = process.env.NODE_ENV;
const isProd = config('stage') === 'prod';
const tinymceENV = env !== 'production' || !isProd ? 'tinymce' : 'tinymce-min-27.5';
const changeTooltipWrap = () => {
  let topOrg = 0;
  let leftOrg = 0;
  let titleOrg = '';
  const topGap = 47;
  return (dispatch, { left, topInput, title }) => {
    let top = topInput;
    if (!title) top = -999;
    if (topOrg !== top || leftOrg !== left || titleOrg !== title) {
      topOrg = top;
      leftOrg = left;
      titleOrg = title;
      dispatch(
        actions.doChangeEditorTooltip({
          top: top - topGap,
          left,
          title,
        })
      );
    }
  };
};
const changeTooltip = changeTooltipWrap();
const editorPasteConfig = {
  paste_remove_styles_if_webkit: false,
  paste_enable_default_filters: false,
  paste_data_images: true,
  paste_preprocess: (plugin, args) => {},
};
const tableConfig = {
  table_toolbar: 'tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
};
const contextmenu = editor => {
  const res = editor.selection.getContent()
    ? 'cut copy paste pastetext lxcontextchangeimage | link linkchecker image imagetools spellchecker configurepermanentpen lximg | table | lxcontextOptimize'
    : 'paste pastetext | link linkchecker image imagetools spellchecker configurepermanentpen lximg | table';
  return res;
};
let lang: Lang = DEFAULT_LANG;
if (inWindow()) {
  lang = systemApi.getSystemLang() || DEFAULT_LANG;
}
const langMap = {
  en: '',
  zh: 'zh_CN',
  'zh-trad': 'zh_Trad',
};
const Arial = getIn18Text('SIYUANHEITI');
const fontFormats = `Carlibri=Carlibri;${Arial}Arial Black=arial black,avant garde;Times New Roman=times new roman,times;Verdana=verdana,geneva;Lucida Grande=lucida grande;Menlo=menlo`;
const getFullpageBodyStyle = () => 'line-height: 1.5; font-size: 14px; color: rgba(38, 42, 51, 0.9);';
export const editorConfig: RawEditorSettings & {
  selector?: undefined;
  target?: undefined;
} = {
  ...editorPasteConfig,
  ...tableConfig,
  // clipboard,
  content_style: tinyStyle,
  contextmenu,
  juice,
  handleCopyImg,
  placeholder: '',
  in_electron: inElectron,
  defaultStyle,
  min_height: 300,
  forced_root_block: 'div',
  font_size_legacy_values: '10px',
  fontsize_formats: '10 11 12 13 14 16 18 24 32 36 48',
  font_formats: fontFormats,
  toolbar_mode: 'sliding',
  // font_css: '/tinymce/font.css',
  font_css: contextPath + `/${tinymceENV}/font.css`,
  valid_children: '+head[style],+body[style],+a[#text],+blockquote[style]',
  extended_valid_elements: 'svg,path,defs,linearGradient,stop,rect',
  statusbar: false,
  nonFormat: true,
  allow_html_in_named_anchor: true,
  fullpage_body_style: getFullpageBodyStyle,
  branding: false,
  elementpath: false,
  language: langMap[lang] || '',
  autoresize_bottom_margin: 0,
  indentation: '15px',
  menubar: false,
  nonbreaking_force_tab: true,
  lineheight_formats: '1.0 1.5 1.75 2.0 3.0',
  outTools: {
    debounce,
    throttle,
  },
  plugins: [
    'advlist autolink lists link lximg image print preview autoresize fullpage media table paste code',
    'searchreplace visualblocks fullscreen nonbreaking lxgrammar lxsignature lxsalespitch lxoptimizecontent lxaiwritemail',
    'lxuploadattachment lxmailformat lxcontact lxformatpainter wordcount lxemoji lxappendcommodity lxcapturescreen lxsplitline',
  ],
};
