import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import './HashLink.css';

export default class HashLink extends Component {
  constructor(props) {
    super(props);

    this.state = {
      copied: false,
    };

    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.setCopied = this.setCopied.bind(this);
  }

  render() {
    const { url, hash, copy, shorten } = this.props;
    const shortenedHash = shorten ? shortenHash(hash) : hash;
    const anchorHash = url ? <Link to={url}>{shortenedHash}</Link> : shortenedHash;

    const anchorCopy = (
      <div className="copy" onMouseLeave={() => {this.setCopied(false);}} data-balloon={this.state.copied? 'Copied to clipboard' : 'Copy'} data-balloon-pos="up-left">
        <button onClick={() => {this.copyToClipboard(hash);}} className="button btn-link" title="Copy hash to clipboard">
          <i className="far fa-copy" />
        </button>
      </div>
    );

    const showCopy = copy && hash !== shortenedHash;

    return (
      <div className={classNames('HashLink break-word', {copyable: showCopy})} title={hash}>
        {anchorHash}
        {showCopy ? anchorCopy : null}
      </div>
    );
  }

  copyToClipboard(str) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    if (selected) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selected);
    }
    this.setCopied(true);
  }

  setCopied(copied) {
    this.setState({copied});
  }
}

function shortenHash(hash) {
  return TextUtils.truncateHash(hash);
}

HashLink.propTypes = {
  url: PropTypes.string,
  hash: PropTypes.string.isRequired,
  copy: PropTypes.bool,
  shorten: PropTypes.bool,
};
HashLink.defaultProps = {
  copy: true,
  shorten: true,
};
