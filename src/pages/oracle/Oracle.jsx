import React, { Component } from 'react';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import ExternalLink from '../../components/ExternalLink';
import './Oracle.css';

class OraclePage extends Component {
  componentDidMount() {}

  render() {
    return (
      <Page className="Oracle">
        <section>
          <PageTitle title="OFFICIAL ZEN ORACLE" />
          {this.renderTopTables()}
        </section>
      </Page>
    );
  }

  renderTopTables() {
    return (
      <div className="row">
        <div className="col-lg-6">
          <SummaryTable />
        </div>
        <div className="col-lg-6">
          <DescriptionTable />
        </div>
      </div>
    );
  }
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
              Intrinio is a Financial Markets data provider that provides a wide range of data ranging
              from US securities, corporate actions, TipRank blogger ratings to CBOE XBT Bitcoin
              Futures Intraday Prices.
            </p>
            <p>
              This Oracle commits to data from Intrinio and provides smart
              contracts the ability to check and verify the data in order to settle the terms of the
              contract.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default OraclePage;
