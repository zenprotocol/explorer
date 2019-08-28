import AddressStore from './AddressStore';
import AssetStore from './AssetStore';
import BlockStore from './BlockStore';
import ContractStore from './ContractStore';
import InfoStore from './InfoStore';
import SearchStore from './SearchStore';
import TransactionStore from './TransactionStore';
import RepoVoteStore from './RepoVoteStore';
import CGPStore from './CGPStore';
import UIStore from './UIStore';

export default class RootStore {
  constructor(initialState = {}) {
    this.addressStore = new AddressStore(this, initialState.addressStore);
    this.assetStore = new AssetStore(this, initialState.assetStore);
    this.blockStore = new BlockStore(this, initialState.blockStore);
    this.contractStore = new ContractStore(this, initialState.contractStore);
    this.infoStore = new InfoStore(this, initialState.infoStore);
    this.searchStore = new SearchStore(this, initialState.searchStore);
    this.transactionStore = new TransactionStore(this, initialState.transactionStore);
    this.repoVoteStore = new RepoVoteStore(this, initialState.repoVoteStore);
    this.cgpStore = new CGPStore(this, initialState.cgpStore);
    this.uiStore = UIStore(this, initialState.uiStore);
  }
}
