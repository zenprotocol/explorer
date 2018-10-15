import React from 'react';
import Page from '../../components/Page';

export default function NotFound(props) {
  return (
    <Page className="NotFound">
      <section className="text-center">
        <h1 className="display-1">404</h1>
        <h3>The page you are looking for was not found</h3>
      </section>
    </Page>
  );
}
