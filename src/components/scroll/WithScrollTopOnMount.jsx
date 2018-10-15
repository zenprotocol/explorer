import React from 'react';
import ScrollToTopOnMount from './ScrollToTopOnMount.jsx';

export default function WithScrollTopOnMount(WrappedComponent) {
  return function HOC(props) {
    return (
      <React.Fragment>
        <ScrollToTopOnMount />
        <WrappedComponent {...props} />
      </React.Fragment>
    );
  };
}
