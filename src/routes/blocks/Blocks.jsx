import React, { Component } from 'react';
import BlocksTable from '../../components/BlocksTable/BlocksTable.jsx';
import blockStore from '../../store/BlockStore';
import '../page.css';
import './Blocks.css';

const DEFAULT_PAGE_SIZE = 10;

class Blocks extends Component {
  render() {
    return (
      <section className="bordered border-left border-primary pl-lg-4">
        <BlocksTable
          store={blockStore}
          title="LATEST BLOCKS"
          pageSize={DEFAULT_PAGE_SIZE}
        />
      </section>
    );
  }
}

export default Blocks;
