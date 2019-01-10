import React from 'react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';

export default function NotFound(props) {
  return (
    <Page className="NotFound">
      <Helmet>
        <title>{TextUtils.getHtmlTitle('Page Not Found')}</title>
      </Helmet>
      <section>
        <PageTitle title="404 Not Found" />
        <h3 className="text-center">The page you are looking for was not found</h3>
      </section>
    </Page>
  );
}
