import React, { Component } from 'react';
import Service from '../../lib/Service';
import RouterUtils from '../../lib/RouterUtils';
import LineChart from '../../components/charts/LineChart.jsx';
import './Chart.css';
import '../page.css';

const PARAM_TO_CHART_MAP = {
  transactions: {
    name: 'transactionsPerDay',
    title: 'Transactions Per Day',
    seriesTitle: 'Total Transactions',
  },
  difficulty: {
    name: 'blockDifficulty',
    title: 'Block Difficulty',
    seriesTitle: 'Average Difficulty',
  },
  hashrate: {
    name: 'networkHashrate',
    title: 'Network Hashrate',
    seriesTitle: 'Average Hashrate',
  },
};

const Mappers = {
  transactionsPerDay(data) {
    return data.map(item => {
      return {
        x: Date.parse(item.dt),
        y: Number(item.count),
      };
    });
  },
  blockDifficulty(data) {
    return data.map(item => {
      return {
        x: Date.parse(item.dt),
        y: Number(item.difficulty),
      };
    });
  },
  networkHashrate(data) {
    return data.map(item => {
      return {
        x: Date.parse(item.dt),
        y: Number(item.hashrate),
      };
    });
  },
};

class Chart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
    };
  }
  componentDidMount() {
    const chart = this.getChartConfig();
    if (chart) {
      Service.stats.charts(chart.name).then(response => {
        if (response.success) {
          this.setState({ data: response.data });
        }
      });
    }
  }

  render() {
    const chart = this.getChartConfig();
    if (!chart) {
      return null;
    }

    return (
      <div className="Chart">
        <section>
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{chart.title}</h1>
          <LineChart data={Mappers[chart.name](this.state.data)} {...chart} />
        </section>
      </div>
    );
  }

  getChartConfig() {
    const { name } = RouterUtils.getRouteParams(this.props);
    return PARAM_TO_CHART_MAP[name];
  }
}

export default Chart;
