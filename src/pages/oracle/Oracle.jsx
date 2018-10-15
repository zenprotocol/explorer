import React, { Component } from 'react';
import { observable, decorate, computed, runInAction, action, autorun } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import localStore from '../../lib/localStore';
import config from '../../lib/Config';
import service from '../../lib/Service';
import getYesterday from './getYesterday';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import ExternalLink from '../../components/ExternalLink';
import HashLink from '../../components/HashLink';
import TickersTable from './components/TickersTable';
import Filters from './components/Filters';
import './Oracle.css';

class OraclePage extends Component {
  constructor(props) {
    super(props);

    this.loading = false;
    this.tableState = {
      items: [],
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };
    this.filterState = {
      date: getYesterday(),
      tickers: [],
    };
    this.allTickers = [];
    this.lastUpdated = '';

    this.bindHandlers();
  }

  get curPageTableItems() {
    const { curPage, pageSize } = this.tableState;
    const { tickers } = this.filterState;
    const items = tickers.length
      ? this.tableState.items.filter(item => tickers.includes(item.ticker))
      : this.tableState.items;
    return items.slice(curPage * pageSize, (curPage + 1) * pageSize);
  }

  get totalItems() {
    const { tickers } = this.filterState;
    const items = tickers.length
      ? this.tableState.items.filter(item => tickers.includes(item.ticker))
      : this.tableState.items;
    return items.length;
  }

  bindHandlers() {
    this.setTickersTableData = this.setTickersTableData.bind(this);
  }

  componentDidMount() {
    this.loadFromStorage();

    autorun(() => {
      this.saveToStorage(this.tableState);
    });

    autorun(() => {
      this.loadTickersTableOnDateChange();
    });

    autorun(() => {
      this.resetTablePageOnTickersChanged();
    });

    this.loadInitialData();
  }

  saveToStorage(data) {
    localStore.set('oracle-data', data);
  }

  loadFromStorage() {
    const data = localStore.get('oracle-data');
    if (data) {
      this.tableState.pageSize = data.pageSize;
    }
  }

  loadInitialData() {
    // get all tickers & last updated
    Promise.all([service.oracle.lastUpdated(), service.oracle.data('', getYesterday())])
      .then(results => {
        const lastUpdated = results[0].data;
        const allTickers = results[1].data.map(item => item.ticker);
        runInAction(() => {
          this.lastUpdated = lastUpdated;
          this.allTickers = allTickers;
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  loadTickersTableOnDateChange() {
    // explicit use of attributes for better mobx recognition
    const { date } = this.filterState;
    if (date) {
      this.loadTickersTableData();
    }
  }

  resetTablePageOnTickersChanged() {
    const { tickers } = this.filterState;
    if (tickers.length) {
      runInAction(() => {
        this.tableState.curPage = 0;
      });
    }
  }

  loadTickersTableData() {
    this.loading = true;
    service.oracle
      .data('', this.filterState.date)
      .then(res => {
        this.setTickersTableData({
          items: res.data || [],
        });
      })
      .catch(error => {
        if (error.status === 404) {
          this.tableState.items = [];
        }
      })
      .then(() => {
        runInAction(() => {
          this.loading = false;
        });
      });
  }

  setTickersTableData(data = {}) {
    Object.keys(data).forEach(key => {
      this.tableState[key] = data[key];
    });
  }

  render() {
    const { pageSize, curPage } = this.tableState;
    return (
      <Page className="Oracle">
        <section>
          <PageTitle
            title={
              <React.Fragment>
                OFFICIAL ZEN ORACLE -{' '}
                <ExternalLink url="https://intrinio.com/">INTRINIO</ExternalLink>
              </React.Fragment>
            }
          />
          <div className="row">
            <div className="col-lg-6">
              <SummaryTable lastUpdated={this.lastUpdated} />
            </div>
            <div className="col-lg-6">
              <DescriptionTable />
            </div>
          </div>
        </section>

        <section>
          <TickersTable
            items={this.curPageTableItems}
            count={this.totalItems}
            pageSize={pageSize}
            curPage={curPage}
            tableDataSetter={this.setTickersTableData}
            loading={this.loading}
            filters={
              <Filters
                filterState={this.filterState}
                allTickers={this.allTickers}
                onReset={this.resetFilters}
              />
            }
            date={this.filterState.date}
          />
        </section>
      </Page>
    );
  }
}

decorate(OraclePage, {
  loading: observable,
  tableState: observable,
  filterState: observable,
  allTickers: observable,
  lastUpdated: observable,
  curPageTableItems: computed,
  totalItems: computed,
  loadTickersTableData: action,
  setTickersTableData: action,
  resetFilters: action,
});

export default observer(OraclePage);

function SummaryTable({ lastUpdated }) {
  return (
    <table className="SummaryTable table table-zen">
      <thead>
        <tr>
          <th scope="col" colSpan="2">
            SUMMARY
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ORACLE NAME</td>
          <td>Intrinio</td>
        </tr>
        <tr>
          <td>CONTRACT HASH</td>
          <td>
            <HashLink
              hash="00000000ca055cc0af4d25ea1c8bbbf41444aadd68a168558397516b2f64727d87e72f97"
              copy={true}
            />
          </td>
        </tr>
        <tr>
          <td>LAST UPDATE</td>
          <td>{lastUpdated}</td>
        </tr>
        <tr>
          <td>WEBSITE</td>
          <td>
            <ExternalLink url="https://intrinio.com/">www.intrinio.com</ExternalLink>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
SummaryTable.propTypes = {
  lastUpdated: PropTypes.string,
};

function DescriptionTable() {
  return (
    <table className="DescriptionTable table table-zen h-100">
      <thead>
        <tr>
          <th scope="col">DESCRIPTION</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="align-middle">
            <p>
              Intrinio is a Financial Markets data provider that provides a wide range of data
              ranging from US securities, corporate actions, TipRank blogger ratings to CBOE XBT
              Bitcoin Futures Intraday Prices.
            </p>
            <p>
              This Oracle commits to data from Intrinio and provides smart contracts the ability to
              check and verify the data in order to settle the terms of the contract.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
