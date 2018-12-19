import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {withRouter} from 'react-router-dom';
import {WithScrollTopOnMount} from '../scroll';
import LatestBlockInfo from '../LatestBlockInfo';
import analytics from '../../lib/analytics';
import './Page.scss';

function Page({className, children, location}) {
  analytics.sendRoute(location.pathname);
  return (
    <div className={classNames('Page', className)}>
      <LatestBlockInfo />
      {children}
    </div>
  );
}

Page.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
  location: PropTypes.object,
};

export default WithScrollTopOnMount(withRouter(Page));