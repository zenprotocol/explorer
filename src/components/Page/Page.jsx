import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {WithScrollTopOnMount} from '../scroll';

function Page({className, children}) {
  return (
    <div className={classNames('Page', className)}>
      {children}
    </div>
  );
}

Page.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
};

export default WithScrollTopOnMount(Page);