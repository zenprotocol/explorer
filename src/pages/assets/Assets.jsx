import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils';
import AssetsTable from './components/AssetsTable';
import Page from '../../components/Page';

class AssetsPage extends Component {
  render() {
    return (
      <Page className="Assets">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Assets', '', true)}</title>
        </Helmet>
        <section>
          <AssetsTable location={this.props.location} history={this.props.history} />
        </section>
      </Page>
    );
  }
}

AssetsPage.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(AssetsPage));
