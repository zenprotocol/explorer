import React, { Component } from 'react';
import { observable, decorate, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import service from '../../lib/Service';
import RouterUtils from '../../lib/RouterUtils';
import CreateContractTemplate from './CreateContractTemplate.jsx';
import Loading from '../../components/Loading';
import './ContractTemplates.scss';

class CreateContractTemplateContainer extends Component {
  constructor(props) {
    super(props);

    this.data = {
      loading: true, // prevent render empty values before fetch
      template: {},
      tickers: {},
    };
  }

  componentDidMount() {
    const { slug } = RouterUtils.getRouteParams(this.props);
    if (!slug) {
      return;
    }

    this.data.loading = true;
    Promise.all([this.fetchTemplate(slug), this.fetchTickers()])
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.data.loading = false;
        });
      });
  }

  fetchTemplate(slug) {
    return service.contractTemplates.findBySlug(slug).then(response => {
      runInAction(() => {
        this.data.template = response.data;
      });
    });
  }

  fetchTickers() {
    return service.oracle.latest().then(response => {
      runInAction(() => {
        // convert the tickers array to a dictionary
        this.data.tickers = response.data.data.reduce((dictionary, cur) => {
          dictionary[cur.ticker] = cur.value;
          return dictionary;
        }, {});
      });
    });
  }

  render() {
    if (this.data.loading) {
      return <Loading />;
    }

    return <CreateContractTemplate template={this.data.template} tickerPrices={this.data.tickers} />;
  }
}
decorate(CreateContractTemplateContainer, {
  data: observable,
});

export default observer(CreateContractTemplateContainer);
