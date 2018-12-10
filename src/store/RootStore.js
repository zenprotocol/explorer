import AddressStore from './AddressStore';
import AssetStore from './AssetStore';
import BlockStore from './BlockStore';
import ContractStore from './ContractStore';
import InfoStore from './InfoStore';
import SearchStore from './SearchStore';
import TransactionStore from './TransactionStore';
import UIStore from './UIStore';

export default class RootStore {
  constructor() {
    this.addressStore = new AddressStore(this);
    this.assetStore = new AssetStore(this);
    this.blockStore = new BlockStore(this);
    this.contractStore = new ContractStore(this);
    this.infoStore = new InfoStore(this);
    this.searchStore = new SearchStore(this);
    this.transactionStore = new TransactionStore(this);
    this.uiStore = UIStore(this);
  }
}
