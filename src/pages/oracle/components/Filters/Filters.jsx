import React, { Component } from 'react';
import { computed, decorate } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import DatePicker from '../../../../components/DatePicker';
import Dropdown from '../../../../components/Dropdown';
import Button from '../../../../components/buttons/Button';
import './Filters.css';

class Filters extends Component {
  constructor(props) {
    super(props);

    this.onDateChange = debounce(this.onDateChange.bind(this), 250);
    this.onTickerDropdownChange = this.onTickerDropdownChange.bind(this);
    this.onDismissTicker = this.onDismissTicker.bind(this);
    this.resetHandler = this.resetHandler.bind(this);
  }

  get allTickers() {
    return [
      'ALL',
      ...this.props.allTickers.filter(ticker => !this.props.filterState.tickers.includes(ticker)),
    ];
  }

  onDateChange(data) {
    if (data.isValid) {
      this.props.filterState.date = data.value;
    }
  }

  onTickerDropdownChange({ value }) {
    const { tickers } = this.props.filterState;
    if (value === 'ALL') {
      tickers.splice(0, tickers.length);
    } else if (!tickers.includes(value)) {
      tickers.push(value);
    }
  }

  onDismissTicker(value) {
    const { tickers } = this.props.filterState;
    if (tickers.includes(value)) {
      tickers.splice(tickers.indexOf(value), 1);
    }
  }

  resetHandler() {
    const { onReset } = this.props;
    if (onReset) {
      onReset();
    }
  }

  render() {
    const { date, tickers } = this.props.filterState;
    const tickersValue = tickers.length ? '' : 'ALL';
    return (
      <div className="Filters">
        <div>
          <h3 className="text-white d-inline-block mr-2">Filters:</h3>
          <div className="selected-filters d-inline-block">
            {tickers.map(ticker => (
              <FilterItem
                key={ticker}
                text={ticker}
                value={ticker}
                onDismiss={this.onDismissTicker}
              />
            ))}
          </div>
        </div>
        <div>
          <form className="form">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-end">
              <div className="mr-3 mb-3 mb-md-0">
                <div>
                  <label>SYMBOL</label>
                </div>
                <div>
                  <Dropdown
                    value={tickersValue}
                    onChange={this.onTickerDropdownChange}
                    options={this.allTickers}
                  />
                </div>
              </div>
              <div className="mr-3 mb-3 mb-md-0">
                <div>
                  <label>DATE (CLOSED PRICE)</label>
                </div>
                <div>
                  <DatePicker value={date} onDateChange={this.onDateChange} />
                </div>
              </div>
              <div>
                <Button size="sm" type="dark-2" onClick={this.resetHandler}>
                  Reset all
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

decorate(Filters, {
  allTickers: computed,
});

Filters.propTypes = {
  filterState: PropTypes.shape({
    date: PropTypes.string.isRequired,
    tickers: PropTypes.array.isRequired,
  }),
  allTickers: PropTypes.array.isRequired,
  onReset: PropTypes.func,
};

export default observer(Filters);

class FilterItem extends Component {
  constructor(props) {
    super(props);

    this.handleDismiss = this.handleDismiss.bind(this);
  }

  handleDismiss() {
    this.props.onDismiss(this.props.value);
  }

  render() {
    const { value } = this.props;
    return (
      <div className="FilterItem badge badge-primary">
        {value}
        <button type="button" onClick={this.handleDismiss}>
          <i className="fas fa-times" />
        </button>
      </div>
    );
  }
}
FilterItem.propTypes = {
  value: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
};
