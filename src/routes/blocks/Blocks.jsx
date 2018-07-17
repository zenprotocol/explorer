import React, { Component } from 'react';
import BlocksTable from '../../components/BlocksTable/BlocksTable.jsx';
import blockStore from '../../store/BlockStore';
import '../page.css';
import './Blocks.css';

class BlocksPage extends Component {
  render() {
    return (
      <section className="bordered border-left border-primary pl-lg-4">
        <BlocksTable
          store={blockStore}
          title="LATEST BLOCKS"
        />
      </section>
    );
  }
}

export default BlocksPage;
