import React from 'react';
import BlocksTable from '../../components/BlocksTable/BlocksTable.jsx';
import './Blocks.css';

function Blocks(props) {
  return (
    <div className="BlocksTableContainer border-left border-primary pl-lg-4 position-relative">
      <BlocksTable blocks={props.blocks} title="LATEST BLOCKS" />
    </div>
  );
}

export default Blocks;