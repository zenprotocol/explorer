import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils';
import BlocksTable from './BlocksTable';
import Page from '../../components/Page';

class BlocksPage extends Component {
  render() {
    const { pathname } = this.props.location;
    const title =
      pathname === '/'
        ? TextUtils.getHtmlTitle('Block Explorer')
        : TextUtils.getHtmlTitle('Blocks', '', true);
    return (
      <Page className="Blocks">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <section>
          <BlocksTable title="LATEST BLOCKS" location={this.props.location} history={this.props.history} />
        </section>
      </Page>
    );
  }
}

BlocksPage.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default inject('rootStore')(BlocksPage);
