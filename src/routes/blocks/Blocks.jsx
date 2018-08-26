import React, { Component } from 'react';
import BlocksTable from '../../components/BlocksTable/BlocksTable.jsx';
import '../page.css';
import './Blocks.css';

class BlocksPage extends Component {
  render() {
    return (
      <section className="bordered border-left border-primary pl-lg-4">
        <BlocksTable
          title="LATEST BLOCKS"
        />
      </section>
    );
  }
}

export default BlocksPage;
