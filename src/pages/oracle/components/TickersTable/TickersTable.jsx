import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ItemsTable from '../../../../components/ItemsTable';

export default class TickersTable extends Component {
  render() {
    const { items, count, pageSize, curPage, tableDataSetter, loading, filters } = this.props;
    return (
      <ItemsTable
        columns={this.getColumns()}
        hideOnMobile={[]}
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
    const { onCopyProof } = this.props;
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
        Cell: data => <CopyProof ticker={data.value} onClick={onCopyProof} />,
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
  onCopyProof: PropTypes.func.isRequired,
};

class CopyProof extends Component {
  constructor(props) {
    super(props);

    this.state = {
      copied: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.resetCopied = this.resetCopied.bind(this);
  }

  handleClick() {
    const { ticker, onClick } = this.props;
    if (onClick && typeof onClick === 'function') {
      onClick(ticker)
        .then(() => {
          this.setState({
            copied: true,
          }, () => {
            this.timeout = setTimeout(this.resetCopied, 2000);
          });
        })
        .catch(() => {});
    }
  }

  resetCopied() {
    this.setState({ copied: false });
  }

  componentDidUpdate(prevProps) {
    if(this.props.ticker !== prevProps.ticker) {
      this.resetCopied();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const aProps = {
      onClick: this.handleClick,
    };
    if (this.state.copied) {
      aProps['data-balloon'] = 'Copied to clipboard';
      aProps['data-balloon-pos'] = 'right';
      aProps['data-balloon-visible'] = true;
    }
    return (
      <div className="CopyProof">
        <a {...aProps}>Copy proof</a>
      </div>
    );
  }
}

CopyProof.propTypes = {
  ticker: PropTypes.string,
  onClick: PropTypes.func,
};
