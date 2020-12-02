import React from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../../components/HashLink';

const DEFAULT_COMMIT_ID = '0000000000000000000000000000000000000000';

export default function CommitLink({ commitId, ...props }) {
  const url =
    commitId === DEFAULT_COMMIT_ID
      ? 'https://gitlab.com/zenprotocol/zenprotocol'
      : `https://gitlab.com/zenprotocol/zenprotocol/commit/${commitId}`;
  return <HashLink url={url} hash={commitId} external {...props} truncateFunc={truncateCommitId} />;
}
CommitLink.propTypes = {
  commitId: PropTypes.string,
};

function validateCommitId(commitId) {
  return /^([0-9a-fA-F]){40}$/.test(commitId);
}

function truncateCommitId(commitId) {
  if (!validateCommitId(commitId)) return commitId;

  return commitId.substring(0, 7);
}