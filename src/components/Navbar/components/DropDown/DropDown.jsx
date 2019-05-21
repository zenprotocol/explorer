import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './DropDown.scss';

export default class NavbarDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
    };

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  open() {
    this.setState({ isOpen: true });
  }
  close() {
    this.setState({ isOpen: false });
  }

  render() {
    const { isOpen } = this.state;
    const { label, className, children } = this.props;
    return (
      <div className={classNames('Navbar-DropDown', className)}>
        <button
          className="nav-link dropdown-toggle"
          onMouseEnter={this.open}
          onMouseLeave={this.close}
        >
          {label}
          <span className="dropdown-arrow">
            <i className={`fas fa-caret-${isOpen ? 'up' : 'down'}`} />
          </span>
        </button>
        <div
          onMouseEnter={this.open}
          onMouseLeave={this.close}
          onClick={this.close}
          className={classNames('dropdown-container', { 'is-open': isOpen })}
        >
          {children}
        </div>
      </div>
    );
  }
}
NavbarDropdown.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any,
};
