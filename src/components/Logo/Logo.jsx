import React from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from '../../assets/logo.png';
import logoAll from '../../assets/logo_all.png';

export default function Logo(props) {
  const imgSrc = props.hideSubtitle ? logo : logoAll;
  return (
    <Link className="navbar-brand text-primary" to="/">
      <img src={imgSrc} className="logo d-inline-block align-middle" alt="Zen Protocol Explorer" />
    </Link>
  );
}

Logo.propTypes = {
  hideSubtitle: PropTypes.bool,
};