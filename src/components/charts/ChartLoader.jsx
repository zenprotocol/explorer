import React, { PureComponent } from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Service from '../../lib/Service';
import TextUtils from '../../lib/TextUtils';
import Loading from '../Loading';
import LineChart from './LineChart.jsx';
import PieChart from './PieChart.jsx';
import './ChartLoader.css';

const PrivateConfigs = {
  distributionMap: {
    type: 'pie',
    xAxisType: 'linear',
    tooltipHeaderFormat: '<span style="font-size: 10px;"><strong>{point.key}</strong></span><br/>',
    dataLabelsFormatter: function() {
      return this.point.x <= 20 || this.point.x === 100
        ? TextUtils.truncateHash(this.point.name)
        : null;
    },
  },
};
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
  zpRichList: Object.assign({}, PrivateConfigs.distributionMap, {
    title: 'ZP Rich List',
    seriesTitle: 'ZP Amount',
    tooltipValueSuffix: ' ZP',
  }),
  assetDistributionMap: Object.assign({}, PrivateConfigs.distributionMap, {
    title: 'Unique keyholder distribution',
    seriesTitle: 'Amount',
  }),
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
        y: Number(item.balanceZp),
      };
    });
  },
  assetDistributionMap(data) {
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

class ChartLoader extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      data: [],
    };

    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    const chartConfig = this.getChartConfig();
    const { externalChartData } = this.props;
    if (externalChartData) {
      return;
    }
    if (chartConfig) {
      this.setState({ loading: true });
      this.currentPromise = Service.stats.charts(chartConfig.name, chartConfig.params);
      this.currentPromise
        .then(response => {
          if (response.success) {
            this.setState({ data: response.data });
          }
          this.setState({ loading: false });
        })
        .catch(err => {
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

  /**
   * data can come from state or an external object
   */
  get chartLoading() {
    return this.state.loading || this.props.externalChartLoading;
  }

  get chartItems() {
    return this.state.data.length ? this.state.data : this.props.externalChartData || [];
  }

  handleChartClick() {
    const { titleLinkTo } = this.props;
    if(titleLinkTo) {
      this.props.history.push(titleLinkTo);
    }
  }

  render() {
    const { chartName, showTitle, titleLinkTo } = this.props;
    const chartConfig = ChartConfigs[chartName];
    if (!chartConfig) {
      return null;
    }
    if (this.chartLoading) {
      return <Loading />;
    }

    if (this.chartItems.length === 0) {
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
    const clickable = !!titleLinkTo;

    return (
      <div className={classNames('Chart', { clickable })} onClick={this.handleChartClick}>
        {showTitle && <div className="title display-4 text-white border-dark">{title}</div>}
        {React.createElement(componentType, {
          data: Mappers[chartName](this.chartItems),
          ...chartConfig,
        })}
      </div>
    );
  }

  getChartConfig() {
    const { chartName, params } = this.props;
    return Object.assign({}, ChartConfigs[chartName], { name: chartName, params });
  }
}

ChartLoader.propTypes = {
  chartName: PropTypes.string.isRequired,
  showTitle: PropTypes.bool,
  titleLinkTo: PropTypes.string,
  externalChartData: PropTypes.array,
  externalChartLoading: PropTypes.bool,
};

export default withRouter(ChartLoader);