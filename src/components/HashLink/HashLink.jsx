import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import ExternalLink from '../ExternalLink';
import * as clipboard from 'clipboard-polyfill';
import TextUtils from '../../lib/TextUtils';
import './HashLink.scss';

export default class HashLink extends Component {
  constructor(props) {
    super(props);

    this.state = {
      copied: false,
    };

    this.copyRef = React.createRef();

    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.setCopied = this.setCopied.bind(this);
  }

  render() {
    const { url, hash, copy, truncate, value, external, truncateFunc } = this.props;
    const truncatedHash = truncate ? truncateFunc(hash) : hash;
    const anchorHash = !url ? (
      truncatedHash
    ) : external ? (
      <ExternalLink url={url}>{truncatedHash}</ExternalLink>
    ) : (
      <Link to={url}>{truncatedHash}</Link>
    );
    const valueToCopy = value ? value : hash;
    const isTruncated = truncatedHash !== valueToCopy;

    const anchorCopy = (
      <div
        ref={this.copyRef}
        className="copy"
        onMouseLeave={() => {
          this.setCopied(false);
        }}
        aria-label={this.state.copied ? 'Copied to clipboard' : 'Copy'}
        data-balloon-pos={this.getTooltipPositionCopy()}
      >
        <button
          onClick={() => {
            this.copyToClipboard(valueToCopy);
          }}
          title=""
          className="btn"
        >
          <i className="fal fa-copy" />
        </button>
      </div>
    );

    return (
      <div className={classNames('HashLink break-word', { copyable: copy })}>
        <span
          className="hash-wrapper"
          title={copy && isTruncated ? valueToCopy : ''}
        >
          {anchorHash}
        </span>
        {copy && valueToCopy ? anchorCopy : null}
      </div>
    );
  }

  getTooltipPositionCopy() {
    if (this.copyRef.current) {
      if (Math.abs(window.innerWidth - this.copyRef.current.getBoundingClientRect().left) < 150) {
        return 'up-right';
      }
    }
    return 'up-left';
  }

  copyToClipboard(str) {
    clipboard.writeText(str).then(() => {
      this.setCopied(true);
    });
  }

  setCopied(copied) {
    this.setState({ copied });
  }
}

HashLink.propTypes = {
  url: PropTypes.string,
  hash: PropTypes.any.isRequired,
  value: PropTypes.string,
  copy: PropTypes.bool,
  truncate: PropTypes.bool,
  external: PropTypes.bool,
  truncateFunc: PropTypes.func,
};
HashLink.defaultProps = {
  copy: true,
  truncate: true,
  truncateFunc: TextUtils.truncateHash,
};
