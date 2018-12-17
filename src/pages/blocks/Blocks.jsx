import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import Service from '../../lib/Service';
import TextUtils from '../../lib/TextUtils';
import BlocksTable from './BlocksTable';
import Page from '../../components/Page';

class BlocksPage extends Component {
  constructor(props) {
    super(props);

    this.fetchBlocksCount = this.fetchBlocksCount.bind(this);
  }
  componentDidMount() {
    this.fetchBlocksCount();
  }

  componentWillUnmount() {
    clearInterval(this.blocksTimer);
  }

  fetchBlocksCount() {
    const { blockStore } = this.props.rootStore;
    Service.blocks.count().then(response => {
      if (Number(response.data) !== blockStore.blocksCount) {
        blockStore.setBlocksCount(Number(response.data));
      }
      this.blocksTimer = setTimeout(this.fetchBlocksCount, 30000);
    });
  }

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
          <BlocksTable title="LATEST BLOCKS" />
        </section>
      </Page>
    );
  }
}

BlocksPage.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object,
};

export default inject('rootStore')(BlocksPage);
