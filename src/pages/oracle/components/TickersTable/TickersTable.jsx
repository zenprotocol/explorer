import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as clipboard from 'clipboard-polyfill';
import service from '../../../../lib/Service';
import { ItemsTable } from '../../../../components/ItemsTable';

export default class TickersTable extends Component {
  render() {
    const { items, count, pageSize, curPage, tableDataSetter, loading, filters } = this.props;
    return (
      <ItemsTable
        columns={this.getColumns()}
        loading={loading}
        itemsCount={count}
        items={items}
        pageSize={pageSize}
        curPage={curPage}
        tableDataSetter={tableDataSetter}
        topContent={filters}
      />
    );
  }

  getColumns() {
    const { date } = this.props;
    return [
      {
        Header: 'SYMBOL',
        accessor: 'ticker',
      },
      {
        Header: 'PRICE',
        accessor: 'value',
        Cell: data => (
          <span className={Number(data.value) < 0 ? 'negative' : 'positive'}>{data.value}</span>
        ),
      },
      {
        Header: 'ORACLE PROOF',
        accessor: 'ticker',
        Cell: data => <CopyProof ticker={data.value} date={date} />,
      },
    ];
  }
}
TickersTable.propTypes = {
  loading: PropTypes.bool,
  items: PropTypes.array,
  count: PropTypes.number,
  pageSize: PropTypes.number,
  curPage: PropTypes.number,
  tableDataSetter: PropTypes.func,
  filters: PropTypes.any,
  date: PropTypes.string.isRequired,
};

class CopyProof extends Component {
  constructor(props) {
    super(props);

    this.state = {
      copied: false,
      copyFailed: false,
      proof: '',
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.reset = this.reset.bind(this);
  }

  handleClick() {
    const { ticker, date } = this.props;
    service.oracle
      .proof(ticker, date)
      .then(response => {
        return response.data;
      })
      .then(proof => {
        this.setState({ proof });
        this.copyToClipboard(proof);
      });
  }

  handleInputFocus(event) {
    event.target.select();
    this.copyToClipboard(this.state.proof);
  }

  copyToClipboard(proof) {
    clipboard
      .writeText(proof)
      .then(() => {
        this.setState(
          {
            copied: true,
          },
          () => {
            this.timeout = setTimeout(() => {
              this.setState({ copied: false });
            }, 2000);
          }
        );
      })
      .catch(() => {
        this.setState({ copyFailed: true });
      });
  }

  reset() {
    this.setState({
      copied: false,
      copyFailed: false,
      proof: '',
    });
  }

  componentDidUpdate(prevProps) {
    const { ticker, date } = this.props;
    if (ticker !== prevProps.ticker || date !== prevProps.date) {
      this.reset();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const balloonProps = this.state.copied
      ? {
          'data-balloon': 'Copied to clipboard',
          'data-balloon-pos': 'up-left',
          'data-balloon-visible': true,
        }
      : {};

    return (
      <div className="CopyProof">
        <div className="balloon" {...balloonProps} />
        <div>
          {this.state.proof ? (
            <input
              type="text"
              className="form-control"
              defaultValue={this.state.proof}
              readOnly
              onFocus={this.handleInputFocus}
            />
          ) : (
            <button className="btn btn-link p-0 border-0 text-light" onClick={this.handleClick}>
              Copy proof
            </button>
            // <a onClick={this.handleClick}>Copy proof</a>
          )}
        </div>
      </div>
    );
  }
}

CopyProof.propTypes = {
  ticker: PropTypes.string,
  date: PropTypes.string,
};
