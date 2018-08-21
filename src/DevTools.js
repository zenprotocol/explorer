import React from 'react';
import DevTools from 'mobx-react-devtools';

export default function DevToolsCustom() {
  if (process.env.NODE_ENV === 'development') {
    return <DevTools />;
  }
  return null;
}

