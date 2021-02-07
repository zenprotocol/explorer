import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Tooltip, useTooltip } from '../Tooltip';
import ExternalLink from '../ExternalLink';
import * as clipboard from 'clipboard-polyfill';
import TextUtils from '../../lib/TextUtils';
import './HashLink.scss';

export default function HashLink({ url, hash, copy, truncate, value, external, truncateFunc }) {
  const [copied, setCopied] = React.useState(false);
  const hashTooltip = useTooltip();
  const copyTooltip = useTooltip();

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

  function copyToClipboard(str) {
    clipboard.writeText(str).then(() => {
      setCopied(true);
    });
  }

  // fix position of copied tooltip after text update
  const updateCopyTT = copyTooltip.update;
  React.useEffect(() => {
    if (copied) {
      updateCopyTT();
    }
  }, [copied, updateCopyTT]);

  const anchorCopy = (
    <div
      ref={copyTooltip.ref}
      className="copy"
      onMouseEnter={copyTooltip.showAndUpdate}
      onMouseLeave={() => {
        setCopied(false);
        copyTooltip.hide();
      }}
    >
      <button
        onClick={() => {
          copyToClipboard(valueToCopy);
        }}
        title=""
        className="btn"
      >
        <i className="fal fa-copy" />
      </button>
      {copyTooltip.visible ? (
        <Tooltip {...copyTooltip.tooltipProps}>{copied ? 'Copied to clipboard' : 'Copy'}</Tooltip>
      ) : null}
    </div>
  );

  return (
    <div className={classNames('HashLink break-word', { copyable: copy })}>
      <span
        className="hash-wrapper"
        ref={hashTooltip.ref}
        onMouseEnter={hashTooltip.showAndUpdate}
        onMouseLeave={hashTooltip.hide}
      >
        {anchorHash}
        {copy && isTruncated && <Tooltip {...hashTooltip.tooltipProps}>{valueToCopy}</Tooltip>}
      </span>
      {copy && valueToCopy ? anchorCopy : null}
    </div>
  );
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
