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
import Button from '../buttons/Button';
import ButtonToolbar from '../buttons/ButtonToolbar';
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
      chartInterval: '1 year',
      data: [],
      cache: {}, // cache results per interval
    };

    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    this.fetchChartData(this.state.chartInterval);
    this.reloadOnBlocksCountChange();
  }

  fetchChartData(chartInterval) {
    const { externalChartData } = this.props;
    if (externalChartData) {
      return;
    }
    const chartConfig = this.getChartConfig();
    if (chartConfig) {
      this.setState({ chartInterval });
      if (this.state.cache[chartInterval]) {
        this.setState((state) => ({ data: state.cache[chartInterval] }));
        this.setState({ loading: false });
      } else {
        this.setState({ loading: true, data: [] });
        this.currentPromise = Service.stats.charts(chartConfig.name, {
          ...chartConfig.params,
          chartInterval,
        });
        this.currentPromise
          .then((response) => {
            if (response.success) {
              this.setState((state) => ({
                data: response.data,
                cache: { ...this.state.cache, [chartInterval]: response.data },
              }));
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
      () => this.fetchChartData(this.state.chartInterval)
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
    const showRangeControls = chartConfig.type !== 'pie';

    const title = titleLinkTo ? (
      <Link to={titleLinkTo}>{chartConfig.title}</Link>
    ) : (
      chartConfig.title
    );
    const clickable = !!titleLinkTo;

    return (
      <div className="Chart">
        <div className={classNames('Chart', { clickable })} onClick={this.handleChartClick}>
          {showTitle && <div className="title display-4 text-white border-dark">{title}</div>}
          <div className="chart-wrapper">
            {this.chartLoading && <Loading className="loading-above" />}
            {React.createElement(componentType, {
              data: Mappers[chartName](this.chartItems),
              ...chartConfig,
            })}
          </div>
        </div>
        {showRangeControls && (
          <ButtonToolbar className="d-flex justify-content-end">
            <Button
              size="sm"
              type="dark-2"
              disabled={this.state.chartInterval === '1 week'}
              onClick={() => this.fetchChartData('1 week')}
            >
              Week
            </Button>
            <Button
              size="sm"
              type="dark-2"
              disabled={this.state.chartInterval === '6 months'}
              onClick={() => this.fetchChartData('6 months')}
            >
              Semester
            </Button>
            <Button
              size="sm"
              type="dark-2"
              disabled={this.state.chartInterval === '1 year'}
              onClick={() => this.fetchChartData('1 year')}
            >
              Year
            </Button>
            <Button
              size="sm"
              type="dark-2"
              disabled={this.state.chartInterval === '100 years'}
              onClick={() => this.fetchChartData('100 years')}
            >
              All
            </Button>
          </ButtonToolbar>
        )}
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
