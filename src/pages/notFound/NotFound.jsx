import React from 'react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils';
import Page from '../../components/Page';

export default function NotFound(props) {
  return (
    <Page className="NotFound">
      <Helmet>
        <title>{TextUtils.getHtmlTitle('Page Not Found')}</title>
      </Helmet>
      <section className="text-center">
        <h1 className="display-1">404</h1>
        <h3>The page you are looking for was not found</h3>
      </section>
    </Page>
  );
}
