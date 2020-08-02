import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils';
import ContractsTable from './components/ContractsTable';
import Page from '../../components/Page';

class ContractsPage extends Component {
  render() {
    return (
      <Page className="Contract">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Contracts', '', true)}</title>
        </Helmet>
        <section>
          <ContractsTable location={this.props.location} history={this.props.history} />
        </section>
      </Page>
    );
  }
}

ContractsPage.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(ContractsPage));
