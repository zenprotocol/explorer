import React from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../../components/HashLink';

export default function CommitLink({ commitId, ...props }) {
  return (
    <HashLink
      url={`https://gitlab.com/zenprotocol/zenprotocol/commit/${commitId}`}
      hash={commitId}
      external
      {...props}
    />
  );
}
CommitLink.propTypes = {
  commitId: PropTypes.string,
};
