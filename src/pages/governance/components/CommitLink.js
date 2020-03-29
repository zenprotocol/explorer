import React from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../../components/HashLink';

const DEFAULT_COMMIT_ID = '0000000000000000000000000000000000000000';

export default function CommitLink({ commitId, ...props }) {
  const url =
    commitId === DEFAULT_COMMIT_ID
      ? 'https://gitlab.com/zenprotocol/zenprotocol'
      : `https://gitlab.com/zenprotocol/zenprotocol/commit/${commitId}`;
  return <HashLink url={url} hash={commitId} external {...props} />;
}
CommitLink.propTypes = {
  commitId: PropTypes.string,
};
