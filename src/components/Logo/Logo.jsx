import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import rootStore from '../../store/RootStore';
import logo from '../../assets/logo.png';
import logoAll from '../../assets/logo_all.png';
import logoAllTestnet from '../../assets/logo_all_testnet.png';

function Logo(props) {
  const imgSrc = props.hideSubtitle ? logo : rootStore.isTestnet ? logoAllTestnet : logoAll;
  return (
    <Link className="navbar-brand text-primary" to="/">
      <img src={imgSrc} className="logo d-inline-block align-middle" alt="Zen Protocol Explorer" />
    </Link>
  );
}

Logo.propTypes = {
  hideSubtitle: PropTypes.bool,
};

export default observer(Logo);
