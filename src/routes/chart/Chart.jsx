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
      Service.stats[chart.name]().then(response => {
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
