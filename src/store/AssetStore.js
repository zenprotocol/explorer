import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';
import AssetUtils from '../lib/AssetUtils';

export default class AssetStore {
  constructor(rootStore) {
    this.rootStore = rootStore;
    this.assets = [];
    this.assetsCount = 0;
    this.asset = {};
    this.assetTxs = [];
    this.assetTxsCount = 0;
    this.assetDistributionData = {
      loading: false,
      data: [],
    };
    this.assetKeyholders = [];
    this.assetKeyholdersCount = 0;
    this.loading = {
      assets: false,
      asset: false,
      assetTxs: false,
      assetKeyholders: false,
    };
  }

  loadAssets(params = {}, { setCount = true, setItems = true } = {}) {
    this.loading.assets = true;

    return Service.assets
      .find(params)
      .then(({ data }) => {
        runInAction(() => {
          if (setItems) {
            this.assets = data.items;
          }
          if (setCount) {
            this.assetsCount = data.count;
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          if (setItems) {
            this.assets = [];
          }
          if (setCount) {
            this.assetsCount = 0;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.assets = false;
        });
      });
  }

  loadAsset(hash) {
    this.loading.asset = true;

    return Service.assets
      .findOne(hash)
      .then(({ data }) => {
        runInAction(() => {
          this.asset = data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.asset = {};
          if (error.status === 404) {
            this.asset.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.asset = false;
        });
      });
  }

  loadAssetTxs(asset, params = {}) {
    this.loading.assetTxs = true;

    return Service.transactions
      .find(Object.assign({ asset }, params))
      .then(({ data }) => {
        runInAction(() => {
          this.assetTxs = data.items;
          this.assetTxsCount = Number(data.total);
        });
      })
      .catch(() => {
        runInAction(() => {
          this.assetTxs = [];
          this.assetTxsCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.assetTxs = false;
        });
      });
  }

  loadAssetDistributionData(asset) {
    this.assetDistributionData.loading = true;
    const chartName = AssetUtils.isZP(asset) ? 'zpRichList' : 'assetDistributionMap';
    return Service.stats
      .charts(chartName, { asset })
      .then(response => {
        runInAction(() => {
          this.assetDistributionData.data = response.data;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.assetDistributionData.data = [];
        });
      })
      .then(() => {
        runInAction(() => {
          this.assetDistributionData.loading = false;
        });
      });
  }

  loadAssetKeyholders(asset, params = {}) {
    this.loading.assetKeyholders = true;

    return Service.assets
      .findKeyholders(asset, params)
      .then(({ data }) => {
        runInAction(() => {
          this.assetKeyholders = data.items;
          this.assetKeyholdersCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.assetKeyholders = [];
          this.assetKeyholdersCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.assetKeyholders = false;
        });
      });
  }
}

decorate(AssetStore, {
  assets: observable,
  assetsCount: observable,
  asset: observable,
  assetTxs: observable,
  assetTxsCount: observable,
  assetDistributionData: observable,
  assetKeyholders: observable,
  assetKeyholdersCount: observable,
  loading: observable,
  loadAssets: action,
  loadAssetTxs: action,
  loadAssetDistributionData: action,
  loadAssetKeyholders: action,
});
