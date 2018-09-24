import React, { Component } from 'react';
import RouterUtils from '../../lib/RouterUtils';
import ChartLoader from '../../components/charts/ChartLoader.jsx';
import './Chart.css';

const PARAM_TO_CHART_MAP = {
  transactions: {
    name: 'transactionsPerDay',
    title: 'Transactions Per Day',
  },
  difficulty: {
    name: 'blockDifficulty',
    title: 'Block Difficulty',
  },
  hashrate: {
    name: 'networkHashRate',
    title: 'Network Hashrate',
  },
  richlist: {
    name: 'zpRichList',
    title: 'ZP Rich List',
  },
  supply: {
    name: 'zpSupply',
    title: 'ZP Supply',
  },
};

class Chart extends Component {
  render() {
    const chartConfig = this.getChartName();
    if (!chartConfig) {
      return null;
    }

    return (
      <div className="ChartPage">
        <section>
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{chartConfig.title}</h1>
          <ChartLoader chartName={chartConfig.name} />
        </section>
      </div>
    );
  }

  getChartName() {
    const { name } = RouterUtils.getRouteParams(this.props);
    return PARAM_TO_CHART_MAP[name];
  }
}

export default Chart;
