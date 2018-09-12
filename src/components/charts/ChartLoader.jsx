import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Service from '../../lib/Service';
import Loading from '../Loading/Loading.jsx';
import LineChart from './LineChart.jsx';
import './ChartLoader.css';

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
    title: 'Network HashRate',
    seriesTitle: 'Avg.Daily HashRate',
  },
  zpRichList: {
    type: 'line',
    xAxisType: 'linear',
    title: 'ZP Rich List',
    seriesTitle: 'Top ZP holders',
    tooltipHeaderFormat:
      '<span style="font-size: 10px"><strong>{point.x}</strong> - {point.key}</span><br/>',
  },
  zpSupply: {
    type: 'line',
    title: 'ZP Supply',
    seriesTitle: 'Total ZP Supply',
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
  zpSupply(data) {
    return data.map(item => {
      return {
        x: Date.parse(item.dt),
        y: Number(item.supply),
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
    const { chartName, showTitle } = this.props;
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

    return (
      <div className="Chart">
        {showTitle && <h5 className="title text-white border-dark">{chartConfig.title}</h5>}
        {React.createElement(componentType, {
          data: Mappers[chartName](this.state.data),
          ...chartConfig,
        })}
      </div>
    );
  }

  getChartConfig() {
    const { chartName } = this.props;
    return Object.assign({}, ChartConfigs[chartName], { name: chartName });
  }
}

ChartLoader.propTypes = {
  chartName: PropTypes.string.isRequired,
  showTitle: PropTypes.bool,
};
