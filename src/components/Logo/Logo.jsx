import React from 'react';
import {Link ,NavLink} from 'react-router-dom';
import logo from '../../logo.png';

export default function Logo(props) {
  return (
    <Link className="navbar-brand text-primary" to="/">
      <img src={logo} className="logo d-inline-block align-middle" alt="" />
      <div className="subtitle d-none d-sm-inline-block">/ BLOCK EXPLORER</div>
    </Link>
  );
}
