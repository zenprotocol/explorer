import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Service from '../../lib/Service';
import TextUtils from '../../lib/TextUtils';
import Loading from '../Loading/Loading.jsx';
import LineChart from './LineChart.jsx';
import PieChart from './PieChart.jsx';
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
  networkHashRate: {
    type: 'line',
    title: 'Network HashRate',
    seriesTitle: 'Avg.Daily HashRate',
  },
  zpRichList: {
    type: 'pie',
    xAxisType: 'linear',
    title: 'ZP Rich List',
    seriesTitle: 'ZP Amount',
    tooltipValueSuffix: ' ZP',
    tooltipHeaderFormat:
      '<span style="font-size: 10px;"><strong>{point.key}</strong></span><br/>',
    dataLabelsFormatter: function () {
      return this.point.x <= 20 || this.point.x === 100 ? TextUtils.truncateHash(this.point.name) : null;
    },
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
  networkHashRate(data) {
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
        x: index,
        y: Number(item.balance),
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

export default class ChartLoader extends PureComponent {
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
      this.currentPromise = Service.stats.charts(chartConfig.name);
      this.currentPromise
        .then(response => {
          if (response.success) {
            this.setState({ data: response.data });
          }
          this.setState({ loading: false });
        })
        .catch((err) => {
          if (!Service.utils.isCancel(err)) {
            this.setState({ loading: false });
          }
        });
    }
  }

  componentWillUnmount() {
    if (this.currentPromise && typeof this.currentPromise.cancel === 'function') {
      this.currentPromise.cancel();
    }
  }

  render() {
    const { chartName, showTitle, titleLinkTo } = this.props;
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
      case 'pie': 
        componentType = PieChart;
        break;
      case 'line':
      default:
        componentType = LineChart;
        break;
    }
    
    const title = titleLinkTo ? (
      <Link to={titleLinkTo}>{chartConfig.title}</Link>
    ) : (
      chartConfig.title
    );

    return (
      <div className="Chart">
        {showTitle && <div className="title display-4 text-white border-dark">{title}</div>}
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
  titleLinkTo: PropTypes.string,
};
