import React from 'react';
import {Link ,NavLink} from 'react-router-dom';
import logo from '../../logo_big.png';
import zenLogo from '../../zen.png';
import classnames from 'classnames';
import './Navbar.css';

export default function Navbar(props) {
  return (
    <div className={classnames(props.className, 'Navbar')}>
      <nav className="navbar navbar-dark navbar-expand-lg py-1 py-lg-3 px-0">
        <Link className="navbar-brand text-primary" to="/">
          <img src={logo} className="logo d-inline-block align-middle" alt="" />
          <img src={zenLogo} className="zen d-inline-block align-middle" alt="" />
          <div className="subtitle d-inline-block">/ BLOCK EXPLORER</div>
        </Link>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <NavLink className="nav-link" to="/blocks">Blocks</NavLink>
            </li>
            {/* <li className="nav-item">
              <NavLink className="nav-link" to="/tx">Transactions</NavLink>
            </li> */}
          </ul>
          {/* <form className="form-inline my-2 my-lg-0">
            <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
          </form> */}
        </div>
      </nav>
    </div>
  );
}