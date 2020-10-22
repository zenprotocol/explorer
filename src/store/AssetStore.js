import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/ApiService';
import AssetUtils from '../lib/AssetUtils';

export default class AssetStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.assets = initialState.assets || [];
    this.assetsCount = initialState.assetsCount || 0;
    this.asset = initialState.asset || {};
    this.assetTxs = initialState.assetTxs || [];
    this.assetTxsCount = initialState.assetTxsCount || 0;
    this.assetDistributionData = initialState.assetDistributionData || {
      loading: false,
      data: [],
    };
    this.assetKeyholders = initialState.assetKeyholders || [];
    this.assetKeyholdersCount = initialState.assetKeyholdersCount || 0;
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
    if (!hash) {
      return Promise.resolve(this.asset);
    }

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
        return this.asset;
      });
  }

  loadAssetTxs(asset, params = {}) {
    this.loading.assetTxs = true;

    return Service.txs
      .find(Object.assign({ asset }, params))
      .then(({ data }) => {
        runInAction(() => {
          this.assetTxs = data.items;
          this.assetTxsCount = Number(data.count);
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
