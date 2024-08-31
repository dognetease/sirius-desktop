/*
 * @Author: wangzhijie02
 * @Date: 2021-11-26 18:36:32
 * @LastEditTime: 2022-05-31 20:39:32
 * @LastEditors: wangzhijie02
 * @Description:
 */
import { message } from 'antd';
import { apiHolder, apis, NetStorageApi, DataTrackerApi, NetStorageShareApi, Template, SystemApi, RequestNSFileCreateInfo } from 'api';
import { TemplateModalSceneType } from '../components/TemplateModal';
import { normalizeShareUrl } from '../utils';
import { getIn18Text } from 'api';
/**
 * personal 个人空间
 * ent 企业空间
 */
type SpaceKind = 'personal' | 'ent';
/**
 * excel 表格
 * doc   文档
 */
type DocType = 'excel' | 'doc';
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
function openFile(url: string) {
  const shareUrl = normalizeShareUrl(url);
  if (systemApi.isElectron()) {
    systemApi.handleJumpUrl(-1, shareUrl);
  } else {
    systemApi.openNewWindow(shareUrl);
  }
}
/**
 *
 * @description 通过模板创建一个文档，并且打开文档编辑器页面。
 * 执行成功则 resolve(true),执行失败则 resolve(false)
 * @param template 模板信息
 * @param spaceKind 空间类型：个人空间 或者 企业空间
 * @param dirId 父目录ID
 * @returns true  执行成功 / false 执行失败
 *
 */
// eslint-disable-next-line max-len
export async function createFileByTemplateId(
  template: Omit<Template, 'previewImageUrl'>,
  spaceKind: SpaceKind,
  dirId: number,
  scene: TemplateModalSceneType = 'default'
): Promise<boolean> {
  // 个人空间 和 企业空间 通过模板创建文档的接口不一样，这里判断一下当前处于哪个空间
  let create = diskApi.createDocByTemplate;
  if (spaceKind === 'personal') {
    create = diskApi.createPersonalDocByTemplate;
  }
  // 异步获取 CurrentWinInfo
  type GetCurrentWinInfoPromise = ReturnType<typeof systemApi.getCurrentWinInfo>;
  let getCurrentWinInfoPromise: GetCurrentWinInfoPromise;
  if (systemApi.isElectron()) {
    getCurrentWinInfoPromise = systemApi.getCurrentWinInfo(true);
  }
  const file = await create
    .call(diskApi, {
      templateId: template.id,
      fileType: template.docType as DocType,
      dirId,
      fileName: template.title,
    })
    .catch(err => {
      /**
       * 灵犀办公云文档，增加了 开启/关闭 个人空间功能。
       * 因此这里处理了，当个人空间处于关闭情况下，Banner创建的文档接口调用会返回 10403 错误码问题。
       */
      if (err && err.data && err.data.code === 10403 && spaceKind === 'personal') {
        message.error(getIn18Text('GERENKONGJIANBEI'));
      }
      return undefined;
    });
  if (file && file.id) {
    // XXX: 下面打开新的文档编辑页面 应该是通用方法，这里直接复制diskHead.tsx的代码，应考虑优化一下。
    const data = await nsShareApi.getNSShareLink({ resourceId: file.id, resourceType: 'FILE' }).catch(() => undefined); // 如果错误不catch 后续代码无法执行
    if (data && data.shareUrl) {
      setTimeout(() => {
        const shareUrl = normalizeShareUrl(data.shareUrl);
        if (systemApi.isElectron()) {
          getCurrentWinInfoPromise?.then(({ webId }) => {
            systemApi.handleJumpUrl(-1, scene === 'tabs' ? `${shareUrl}&targetWindow=${webId}` : shareUrl);
          });
        } else {
          systemApi.openNewWindow(shareUrl);
        }
      }, 0);
      return true;
    }
  }
  return false;
}
export interface CreateFileExtraOption {
  /**文件类型 ，用于埋点使用*/
  docType: string;
  /**
   * filePage-new   Doc详情页新建
   * List-new       列表页创建文档
   * Blank-new      空白页创建文档
   */
  way: 'List-new' | 'filePage-new' | 'Blank-new';
  /**文件创建失败 */
  onFileCreateFailed?: () => void;
  onFileCreateSuccessed?: () => void;
  onFileOpenFailed?: () => void;
  onFileOpenSuccessed?: () => void;
}
/**
 * 创建空白文档
 * @param req
 * @param option
 * @returns 返回resolved promise，true打开了新文件，false表示失败
 */
export async function createFile(req: RequestNSFileCreateInfo, option: CreateFileExtraOption): Promise<boolean> {
  return new Promise(resolve => {
    diskApi.doCreateFile(req).then(ret => {
      if (!ret?.id) {
        option.onFileCreateFailed && option.onFileCreateFailed();
        resolve(false);
        return;
      }
      option.onFileCreateSuccessed && option.onFileCreateSuccessed();
      const curUser = systemApi.getCurrentUser();
      trackerApi.track('pcDisk_new', {
        type: option.docType,
        way: option.way,
        fileid: ret.id,
        useraccount: curUser?.id,
      });
      nsShareApi
        .getNSShareLink({ resourceId: ret.id, resourceType: 'FILE' })
        .then(data => {
          if (data.shareUrl) {
            setTimeout(() => {
              openFile(data.shareUrl);
            });
            option.onFileOpenSuccessed && option.onFileOpenSuccessed();
          } else {
            option.onFileOpenFailed && option.onFileOpenFailed();
          }
          resolve(true);
        })
        .catch(() => {
          option.onFileOpenFailed && option.onFileOpenFailed();
          resolve(false);
        });
    });
  });
}
