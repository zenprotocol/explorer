import React, {Component} from 'react';


export default class BlocksTable extends Component {
  render() {
    return (
      <div>
        {this.props.blocks.map((block) => {
          return <div key={block.id}>{block.parent}</div>;
        })}
      </div>
    );
  }
}

