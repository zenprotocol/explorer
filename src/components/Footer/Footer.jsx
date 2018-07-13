import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import classnames from 'classnames';
import './Footer.css';

export default function Footer(props) {
  return (
    <footer className="Footer">
      <div className="row">
        <div className="col-lg-6">
          <div>
            <Logo hideSubtitle={true} />
          </div>
          <div>
            <div className="row">
              <div className="logo-padding col-md-4">
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <a className="nav-link" target="_blank" href="https://www.zenprotocol.com/deck/zen_protocol_deck_en.pdf">
                      Pitch Deck
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="https://www.zenprotocol.com/files/zen_protocol_white_paper.pdf" target="_top">
                      White Paper
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="https://www.zenprotocol.com/files/technical_paper.pdf" target="_top">
                      Technical Paper
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="https://docs.zenprotocol.com/" target="_blank">
                      Documentation
                    </a>
                  </li>
                </ul>
              </div>
              <div className="logo-padding col-md-4">
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <a className="nav-link active" href="#">
                      Active
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">
                      Link
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">
                      Link
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link disabled" href="#">
                      Disabled
                    </a>
                  </li>
                </ul>
              </div>
              <div className="logo-padding col-md-4">
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <a className="nav-link active" href="#">
                      Active
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">
                      Link
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#">
                      Link
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link disabled" href="#">
                      Disabled
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6" />
      </div>
    </footer>
  );
}
