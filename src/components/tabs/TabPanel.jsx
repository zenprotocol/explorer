import PropTypes from 'prop-types';

export default function TabPanel({ children }) {
  return children || null;
}

TabPanel.propTypes = {
  id: PropTypes.string,
  children: PropTypes.any,
};
