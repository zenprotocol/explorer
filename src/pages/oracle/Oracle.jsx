import React, { Component } from 'react';
import { observable, decorate, computed, runInAction, action, autorun } from 'mobx';
import { observer } from 'mobx-react';
import config from '../../lib/Config';
import service from '../../lib/Service';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import ExternalLink from '../../components/ExternalLink';
import TickersTable from './components/TickersTable';
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
      ticker: '',
    };

    autorun(() => {
      this.loadTickersTableOnFilterChange();
    });

    this.setTickersTableData = this.setTickersTableData.bind(this);
  }

  get curPageTableItems() {
    const { curPage, pageSize } = this.tableState;
    return this.tableState.items.slice(curPage * pageSize, (curPage + 1) * pageSize);
  }

  loadTickersTableOnFilterChange() {
    if (this.filterState.date || this.filterState.ticker) {
      this.loadTickersTableData();
    }
  }

  loadTickersTableData() {
    this.loading = true;
    service.oracle
      .tickersByDate(this.filterState.date)
      .then(res => {
        this.setTickersTableData({
          items: res.data,
        });
      })
      .catch(() => {})
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
    const { items, pageSize, curPage } = this.tableState;
    return (
      <Page className="Oracle">
        <section>
          <PageTitle title="OFFICIAL ZEN ORACLE" />
          <div className="row">
            <div className="col-lg-6">
              <SummaryTable />
            </div>
            <div className="col-lg-6">
              <DescriptionTable />
            </div>
          </div>
        </section>

        <section>
          <TickersTable
            items={this.curPageTableItems}
            count={items.length}
            pageSize={pageSize}
            curPage={curPage}
            tableDataSetter={this.setTickersTableData}
            loading={this.loading}
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
  curPageTableItems: computed,
  loadTickersTableData: action,
});

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function SummaryTable() {
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
          <td />
        </tr>
        <tr>
          <td>LAST UPDATE</td>
          <td>???</td>
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

export default observer(OraclePage);
