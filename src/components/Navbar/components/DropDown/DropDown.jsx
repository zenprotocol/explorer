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

    // refs for the "click outside" event
    this.containerRef = React.createRef();
    this.togglerRef = React.createRef();

    this.toggle = this.toggle.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  toggle() {
    this.setState(state => ({ isOpen: !state.isOpen }));
  }
  close() {
    this.setState({ isOpen: false });
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside, false);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside, false);
  }

  handleClickOutside(e) {
    if (this.containerRef.current.contains(e.target) || this.togglerRef.current.contains(e.target))
      return;

    this.close();
  }

  render() {
    const { label, className, children } = this.props;
    return (
      <div className={classNames('Navbar-DropDown', className)}>
        <a
          className="nav-link dropdown-toggle"
          role="button"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={this.toggle}
          ref={this.togglerRef}
        >
          {label}
        </a>
        <div
          className={classNames('dropdown-container', { 'is-open': this.state.isOpen })}
          ref={this.containerRef}
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
