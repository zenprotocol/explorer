import React from 'react';
import Loading from '../Loading';

export default function AsyncComponentLoading({isLoading, error}) {
  if (isLoading) {
    return <Loading />;
  }
  else if (error) {
    return <div>Sorry, there was a problem loading the page.</div>;
  }
  else {
    return null;
  }
}
