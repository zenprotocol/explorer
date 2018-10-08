import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, withRouter } from 'react-router-dom';

function Tab({ match, id, children }) {
  return (
    <li className="Tab nav-item">
      <NavLink className="nav-link" to={`${match.url}/${id}`}>
        {children}
      </NavLink>
    </li>
  );
}

Tab.propTypes = {
  id: PropTypes.string,
  children: PropTypes.any,
  match: PropTypes.object,
};

export default withRouter(Tab);
