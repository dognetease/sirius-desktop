import { Api } from '@/api/_base/api';

export interface IMenuObject {
  menuLabel: string;
  menuName: string;
}

export interface IAllMenu {
  menuLabel: string;
  menuName: string;
  subMenuItems: IAllMenu[];
}

export interface EdmMenusApi extends Api {
  getPinnedMenus: (req: { productId: string; productVersionId: string }) => Promise<IMenuObject[]>;

  updatePinnedMenus: (req: { productId: string; productVersionId: string; usefulMenuLabels: string[] }) => Promise<any>;

  getAllPinnedMenus: (req: { productId: string; productVersionId: string }) => Promise<IAllMenu[]>;
}
