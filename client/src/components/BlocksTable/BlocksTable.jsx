import React, {Component} from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import './BlocksTable.css';
import PaginationComponent from './Pagination';

const PAGE_SIZES = [5, 10, 20, 50, 100];
const MAX_PAGINATION_BUTTONS = 5;

export default class BlocksTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageSize: 10,
      page: 0,
    };

    this.setPageSize = this.setPageSize.bind(this);
  }
  getTableColumns() {
    return [
      {
        Header: 'Block number',
        accessor: 'blockNumber',
        className: 'text-primary',
      },
      {
        Header: 'Version',
        accessor: 'version',
        width: 80,
      },
      {
        Header: 'Parent',
        accessor: 'parent',
        className: 'text-primary',
      },
      {
        Header: 'Commitments',
        accessor: 'commitments',
        className: 'text-primary',
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp'
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty'
      },
      {
        Header: 'Nonce1',
        accessor: 'nonce1'
      },
      {
        Header: 'Nonce2',
        accessor: 'nonce2'
      },
    ];
  }

  setPageSize(event) {
    this.setState({pageSize: Number(event.target.value)});
  }

  render() {
    return (
      <div className="BlocksTable">
        <div className="clearfix">
          {this.props.title && <h1 className="d-inline-block">{this.props.title}</h1>}
          <div className="BlocksTable-pageSizes form-inline float-right">
            <span className="mr-1">SHOW</span>
            <select value={this.state.pageSize} onChange={this.setPageSize} className="form-control">
              {PAGE_SIZES.map(pageSize => {
                return (
                  <option key={pageSize} value={pageSize}>{pageSize}</option>
                );
              })}
            </select> 
            <span className="ml-1">ENTRIES</span> 
          </div>
        </div>
        <ReactTable
          data={this.props.blocks}
          columns={this.getTableColumns()}
          showPaginationBottom={true}
          defaultPageSize={10}
          pageSizeOptions={PAGE_SIZES}
          pageSize={this.state.pageSize}
          PaginationComponent={PaginationComponent}
        />
      </div>
    );
  }
}

