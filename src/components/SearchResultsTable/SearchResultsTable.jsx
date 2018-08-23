import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class SearchResultsTable extends Component {
  render() {
    const { items, title, columns } = this.props;
    if (!items || !items.length) {
      return null;
    }

    return (
      <div className="search-results-group">
        <table className="table">
          <thead>
            <tr>
              <th colSpan={columns.length}>{title}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, itemIndex) => (
              <tr key={itemIndex}>
                {columns.map((column, columnIndex) => (
                  <td key={columnIndex} className={column.className}>
                    <span>{this.executeCellFunction(this.getItemValue(item, column), column.cell)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  getItemValue(item, column) {
    const accessor = column.accessor;
    const pathArr = accessor.split('.');
    return pathArr.reduce((obj, key) =>
      (obj && obj[key] !== 'undefined') ? obj[key] : undefined, item);
  }

  executeCellFunction(cellData, cellFunction) {
    if(typeof cellData !== 'undefined' && typeof cellFunction === 'function') {
      return cellFunction(cellData);
    }
    return cellData;
  }
}

SearchResultsTable.propTypes = {
  items: PropTypes.array,
  title: PropTypes.string,
  columns: PropTypes.array.isRequired,
};
