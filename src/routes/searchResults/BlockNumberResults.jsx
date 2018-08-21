import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import TextUtils from '../../lib/TextUtils';

export default class BlockNumberResults extends Component {
  render() {
    return (
      <table className="table">
        <thead>
          <tr>
            <th colSpan="2">BLOCKS</th>
          </tr>
        </thead>
        <tbody>
          {this.props.items.map((block) => (
            <tr key={block.blockNumber}>
              <td><Link to={`/blocks/${block.blockNumber}`}>{block.blockNumber}</Link></td>
              <td>{TextUtils.getDateStringFromTimestamp(block.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

BlockNumberResults.propTypes = {
  items: PropTypes.array,
};
