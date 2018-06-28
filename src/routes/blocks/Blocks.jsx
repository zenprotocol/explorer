import React, { Component } from 'react';
import BlocksTable from '../../components/BlocksTable/BlocksTable.jsx';
import blockStore from '../../store/BlockStore';
import './Blocks.css';

const DEFAULT_PAGE_SIZE = 10;

class Blocks extends Component {
  componentDidMount() {
    blockStore.fetchMedianTime();
  }
  render() {
    return (
      <div className="BlocksTableContainer border-left border-primary pl-lg-4 position-relative">
        <BlocksTable
          store={blockStore}
          title="LATEST BLOCKS"
          pageSize={DEFAULT_PAGE_SIZE}
        />
      </div>
    );
  }
}

export default Blocks;
