// import {
//   IpcMainChannelManage,
//   IpcMainSend,
// } from "../declare/IpcChannelManage";
// import {windowManage} from "./windowManage";
//
// class ipcChannelManageImpl implements IpcMainChannelManage {
//
//   send(req: IpcMainSend): void {
//     const win = windowManage.getWindow();
//     win.webContents.send(req.channel, req.data);
//   }
//
// }
//
// export const ipcChannelManage = new ipcChannelManageImpl();
