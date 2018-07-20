import React from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from '../../logo.png';
import logoAll from '../../logo_all.png';

export default function Logo(props) {

  return (
    const logoSrc = props.hideSubtitle ? logoAll : lgo
    <Link className="navbar-brand text-primary" to="/">
      <img src={this.getlogo} className="logo d-inline-block align-middle" />
    </Link>
  );
}

Logo.propTypes = {
  hideSubtitle: PropTypes.bool,
};