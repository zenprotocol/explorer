import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Service from '../../lib/ApiService';
import TextUtils from '../../lib/TextUtils';
import Loading from '../Loading';
import LineChart from './LineChart.jsx';
import PieChart from './PieChart.jsx';
import './ChartLoader.scss';

const PrivateConfigs = {
  distributionMap: {
    type: 'pie',
    xAxisType: 'linear',
    dataLabelsFormatter: function () {
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
    return data.map((item) => {
      return {
        x: Date.parse(item.date),
        y: Number(item.value),
      };
    });
  },
  blockDifficulty(data) {
    return data.map((item) => {
      return {
        x: Date.parse(item.date),
        y: Number(item.value),
      };
    });
  },
  networkHashRate(data) {
    return data.map((item) => {
      return {
        x: Date.parse(item.date),
        y: Number(item.value),
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
    return data.map((item) => {
      return {
        x: Date.parse(item.date),
        y: Number(item.value),
      };
    });
  },
};

class ChartLoader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      isFirstLoad: true,
      data: [],
    };

    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    this.fetchChartData();
    this.reloadOnBlocksCountChange();
  }

  fetchChartData() {
    const { externalChartData } = this.props;
    if (externalChartData) {
      return;
    }
    const chartConfig = this.getChartConfig();
    if (chartConfig) {
      this.setState((state) => ({ loading: state.isFirstLoad }));
      this.currentPromise = Service.stats.charts(chartConfig.name, chartConfig.params);
      this.currentPromise
        .then((response) => {
          if (response.success) {
            this.setState({ data: response.data });
          }
          this.setState({ loading: false, isFirstLoad: false });
        })
        .catch((err) => {
          if (!Service.utils.isCancel(err)) {
            this.setState({ loading: false, isFirstLoad: false });
          }
        });
    }
  }

  componentWillUnmount() {
    this.stopReload();
    if (this.currentPromise && typeof this.currentPromise.cancel === 'function') {
      this.currentPromise.cancel();
    }
  }

  reloadOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => this.fetchChartData()
    );
  }
  stopReload() {
    this.forceDisposer();
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
    if (titleLinkTo) {
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

export default withRouter(inject('rootStore')(observer(ChartLoader)));
