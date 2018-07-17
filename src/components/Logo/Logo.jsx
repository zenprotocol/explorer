import React from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from '../../logo.png';
import logoAll from '../../logo_all.png';

export default function Logo(props) {
  return (
    <Link className="navbar-brand text-primary" to="/">
      {!props.hideSubtitle? (
        <img src={logoAll} className="logo d-inline-block align-middle" alt="" />
      ): (
        <img src={logo} className="logo d-inline-block align-middle" alt="" />
      )}
    </Link>
  );
}

Logo.propTypes = {
  hideSubtitle: PropTypes.bool,
};