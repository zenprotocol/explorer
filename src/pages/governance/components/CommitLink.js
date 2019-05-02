import React from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../../components/HashLink';

export default function CommitLink({ commitId }) {
  return (
    <HashLink
      url={`https://github.com/search?q=${commitId}&type=Commits`}
      hash={commitId}
      external
    />
  );
}
CommitLink.propTypes = {
  commitId: PropTypes.string,
};