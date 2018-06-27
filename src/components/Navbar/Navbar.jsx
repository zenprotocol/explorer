import React from 'react';
import logo from '../../logo_big.png';
import classnames from 'classnames';
import './Navbar.css';

export default function Navbar(props) {
  return (
    <div className={classnames(props.className, 'Navbar')}>
      <nav className="navbar navbar-expand-lg py-1 py-lg-3 px-0">
        <a className="navbar-brand" href="#">
          <img src={logo} className="d-inline-block" alt="" />
          <span>ZEN / BLOCK EXPLORER</span>
        </a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <a className="nav-link" href="#">Blocks</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Transactions</a>
            </li>
          </ul>
          <form className="form-inline my-2 my-lg-0">
            <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
          </form>
        </div>
      </nav>
    </div>
  );
}