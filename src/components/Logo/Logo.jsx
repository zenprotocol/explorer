import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import logoAll from '../../assets/logo_all.png';
import logoAllTestnet from '../../assets/logo_all_testnet.png';

function Logo(props) {
  const { infoStore } = props.rootStore;
  const imgSrc = props.hideSubtitle ? logo : infoStore.isTestnet ? logoAllTestnet : logoAll;
  return (
    <Link className="navbar-brand text-primary" to="/">
      <img src={imgSrc} className="logo d-inline-block align-middle" alt="Zen Protocol Explorer" />
    </Link>
  );
}

Logo.propTypes = {
  hideSubtitle: PropTypes.bool,
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(Logo));
