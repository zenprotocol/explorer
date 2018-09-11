import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Service from '../../lib/Service';
import Loading from '../Loading/Loading.jsx';
import LineChart from './LineChart.jsx';

const ChartConfigs = {
  transactionsPerDay: {
    type: 'line',
    title: 'Transactions Per Day',
    seriesTitle: 'Total Transactions',
  },
  blockDifficulty: {
    type: 'line',
    title: 'Block Difficulty',
    seriesTitle: 'Average Difficulty',
  },
  networkHashrate: {
    type: 'line',
    title: 'Network Hashrate',
    seriesTitle: 'Average Hashrate',
  },
  zpRichList: {
    type: 'line',
    xAxisType: 'linear',
    title: 'ZP Rich List',
    seriesTitle: 'Top ZP holders',
    tooltipHeaderFormat: '<span style="font-size: 10px"><strong>{point.x}</strong> - {point.key}</span><br/>'
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
  zpRichList(data) {
    return data.map((item, index) => {
      return {
        name: item.address,
        y: Number(item.balance),
        x: index + 1,
      };
    });
  },
};

export default class ChartLoader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      data: [],
    };
  }

  componentDidMount() {
    const chartConfig = this.getChartConfig();
    if (chartConfig) {
      this.setState({ loading: true });
      Service.stats
        .charts(chartConfig.name)
        .then(response => {
          if (response.success) {
            this.setState({ data: response.data });
          }
          this.setState({ loading: false });
        })
        .catch(() => {
          this.setState({ loading: false });
        });
    }
  }

  render() {
    const { chartName } = this.props;
    const chartConfig = ChartConfigs[chartName];
    if (!chartConfig) {
      return null;
    }
    if (this.state.loading) {
      return <Loading />;
    }

    if (this.state.data.length === 0) {
      return null;
    }

    let componentType = null;
    switch (chartConfig.type) {
      case 'line':
      default:
        componentType = LineChart;
        break;
    }

    return React.createElement(componentType, {
      data: Mappers[chartName](this.state.data),
      ...chartConfig,
    });
  }

  getChartConfig() {
    const { chartName } = this.props;
    return Object.assign({}, ChartConfigs[chartName], { name: chartName });
  }
}

ChartLoader.propTypes = {
  chartName: PropTypes.string.isRequired,
};
