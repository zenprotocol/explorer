import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import TextUtils from '../../lib/TextUtils';

export default class BlockNumberResults extends Component {
  render() {
    const {items} = this.props;
    if(!items || !items.length) {
      return null;
    }

    return (
      <div className="search-results-group">
        <table className="table">
          <thead>
            <tr>
              <th colSpan="2">BLOCKS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((block) => (
              <tr key={block.blockNumber}>
                <td><Link to={`/blocks/${block.blockNumber}`}>{block.blockNumber}</Link></td>
                <td>{TextUtils.getDateStringFromTimestamp(block.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

BlockNumberResults.propTypes = {
  items: PropTypes.array,
};
