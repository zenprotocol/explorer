import React, { Component } from 'react';
import { observable, action, reaction, decorate, computed } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/buttons/Button';
import Dropdown from '../../components/Dropdown';
import DatePicker from '../../components/DatePicker';

class CreateContractTemplate extends Component {
  constructor(props) {
    super(props);

    this.data = {
      name: {
        value: '',
        valid: true,
      },
      oracle: {
        value: '',
        valid: true,
      },
      ticker: {
        value: '',
        valid: true,
      },
      date: {
        value: '',
        valid: true,
      },
      strike: {
        value: 0,
        valid: true,
      },
    };
    this.valid = true;

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleTickerChange = this.handleTickerChange.bind(this);
    this.handleStrikeChange = this.handleStrikeChange.bind(this);
    this.handleResetForm = this.handleResetForm.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  get tickers() {
    const tickers = Object.keys(this.props.tickerPrices);
    return tickers.length
      ? tickers
      : [
          'AAPL',
          'GOOG',
          'TRIP',
          'INTC',
          'ZNGA',
          'MSFT',
          'FB',
          'AAL',
          'ADSK',
          'AMAT',
          'AMZN',
          'BIDU',
          'CHKP',
          'CMCSA',
          'FOX',
          'PYPL',
          'QCOM',
          'AABA',
          'TSLA',
        ];
  }

  componentDidMount() {
    this.resetForm();
    this.validateOnDataChange();
  }

  validateOnDataChange() {
    reaction(() => Object.values(this.data).map(data => data.value), () => {
      if(!this.valid) {
        this.validate();
      }
    });
  }

  handleNameChange(event) {
    this.data.name.value = event.target.value;
  }

  handleDateChange(data) {
    if (data.isValid) {
      this.data.date.value = data.value;
    }
  }

  handleTickerChange(data) {
    this.data.ticker.value = data.value;
    this.setStrikeByTicker(data.value);
  }

  setStrikeByTicker(ticker) {
    const price = this.props.tickerPrices[ticker];
    if (price) {
      this.data.strike.value = Math.round(price);
    }
  }

  handleStrikeChange(event) {
    this.data.strike.value = Number(event.target.value.trim().replace(/[^\d]/, ''));
  }

  handleResetForm() {
    this.resetForm();
  }

  resetForm() {
    this.data.name.value = this.props.template.name || '';
    this.data.name.valid = true;
    this.data.oracle.value = 'intrinio';
    this.data.oracle.valid = true;
    this.data.ticker.value = '';
    this.data.ticker.valid = true;
    this.data.date.value = '';
    this.data.date.valid = true;
    this.data.strike.value = 0;
    this.data.strike.valid = true;
    this.valid = true;
  }

  handleSubmit(event) {
    event.preventDefault();
    this.validate();
    if (!this.valid) {
      return;
    }

    const generatedTemplate = this.generateTemplate();
    if (generatedTemplate) {
      // download
      console.log(generatedTemplate);
    }
  }

  validate() {
    const { name, oracle, ticker, date, strike } = this.data;
    
    name.valid = !!name.value;
    oracle.valid = !!oracle.value;
    ticker.valid = !!ticker.value;
    date.valid = !!date.value;
    strike.valid =
      strike.value &&
      !isNaN(strike.value) &&
      strike.value >= 0 &&
      Math.floor(strike.value) === strike.value;

    this.valid = name.valid && oracle.valid && ticker.valid && date.valid && strike.valid;
  }

  generateTemplate() {
    const { template } = this.props.template;
    if (!template) {
      return '';
    }

    // TODO - do this on the server - create a route for that - download the generated file.
    const timestamp = Math.round(new Date(this.data.date.value).getTime() / 1000);
    const comment = `(* NAME_START:${this.data.name.value} - ${this.data.ticker.value} - ${
      this.data.date.value
    }UL - ${this.data.strike.value}UL:NAME_END *)`;
    let generated =
      comment +
      '\n' +
      template
        .replace('let ticker = "GOOG"', `let ticker = "${this.data.ticker.value}"`)
        .replace('let unixtime = 1539205200UL', `let unixtime = ${timestamp}UL`)
        .replace('let strike = 1200000UL', `let strike = ${this.data.strike.value * 1000}UL`);

    console.log({ generated });
  }

  render() {
    const { template } = this.props;
    return (
      <Page className="CreateContractTemplate">
        <section>
          <PageTitle title={template.name} />
          <div className="row">
            <div className="col-lg-7">{this.renderForm()}</div>
            <div className="col-lg-5 d-none d-lg-block">
              <h3>About this contract</h3>
              <p>{template.description}</p>
            </div>
          </div>
        </section>
      </Page>
    );
  }

  renderForm() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group d-none">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            value={this.data.name.value}
            onChange={this.handleNameChange}
            placeholder="Enter name"
          />
        </div>
        <div className="form-group">
          <label>Oracle</label>
          <Dropdown
            value={this.data.oracle.value}
            options={[{ value: 'intrinio', label: 'Intrinio' }]}
          />
          <div className="invalid-feedback" {...this.getValidationDisplayProp('oracle')}>
            Please choose an oracle.
          </div>
        </div>
        <div className="form-group">
          <label>Ticker</label>
          <Dropdown
            options={this.tickers}
            value={this.data.ticker.value}
            placeholder="Choose ticker"
            onChange={this.handleTickerChange}
          />
          <div className="invalid-feedback" {...this.getValidationDisplayProp('ticker')}>
            Please choose a ticker.
          </div>
        </div>
        <div className="form-group">
          <label>Expiration date</label>
          <DatePicker onDateChange={this.handleDateChange} value={this.data.date.value} />
          <div className="invalid-feedback" {...this.getValidationDisplayProp('date')}>
            Please pick an expiration date.
          </div>
        </div>
        <div className="form-group">
          <label>Strike</label>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text">$</span>
            </div>
            <input
              type="text"
              className="form-control"
              value={this.data.strike.value}
              onChange={this.handleStrikeChange}
              placeholder="Enter strike"
            />
            <div className="invalid-feedback" {...this.getValidationDisplayProp('strike')}>
              Please provide a strike.
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between">
          <Button type="dark-2" onClick={this.handleResetForm}>
            Reset form
          </Button>
          <Button isSubmit={true}>Download template</Button>
        </div>
      </form>
    );
  }

  getValidationDisplayProp(key) {
    return {
      style: {
        display: this.data[key].valid ? 'none' : 'block',
      },
    };
  }
}
CreateContractTemplate.propTypes = {
  template: PropTypes.object.isRequired,
  tickerPrices: PropTypes.object.isRequired,
};

decorate(CreateContractTemplate, {
  data: observable,
  valid: observable,
  handleNameChange: action,
  handleDateChange: action,
  resetForm: action,
  validate: action,
  tickers: computed,
});

export default observer(CreateContractTemplate);
