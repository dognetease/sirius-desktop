import { apiHolder } from 'api';

const systemApi = apiHolder.api.getSystemApi();
class Npsmeter {
  private instance: any = null;

  getInstance(): Promise<any> {
    if (this.instance) {
      return Promise.resolve(this.instance);
    }

    if (typeof window === 'undefined') {
      return Promise.resolve(null);
    }

    if (window.npsmeter) {
      return Promise.resolve(window.npsmeter);
    }

    return new Promise(res => {
      window.npsmeterCb = {
        onReady() {
          res(window.npsmeter || null);
        },
      };
    });
  }

  async open(id: string) {
    const user = systemApi.getCurrentUser();
    console.log('@@@ user', user);
    if (!user?.id) {
      return;
    }
    window?.npsmeter && window?.npsmeter({ user_id: user?.id, user_name: user?.id });
    const npsmeterInstance = await this.getInstance();
    npsmeterInstance.open(id);
  }

  async hideBtn() {
    const npsmeterInstance = await this.getInstance();
    npsmeterInstance.hideBtn();
  }

  async showBtn() {
    const npsmeterInstance = await this.getInstance();
    npsmeterInstance.showBtn();
  }
}

export const npsmeter = new Npsmeter();
