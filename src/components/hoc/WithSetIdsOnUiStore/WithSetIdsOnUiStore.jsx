import React, { Component } from 'react';
import RouterUtils from '../../../lib/RouterUtils';

/**
 * Set ids in the UI store automatically
 *
 * @param {*} WrappedComponent
 * @param {*} uiStoreFunctionName
 * @param {[string]} [ids=[]] - a list of ids for the ui table
 * @returns HOC
 */
export default function WithSetIdsOnUiStore(
  WrappedComponent,
  uiStoreFunctionName,
  ids = []
) {
  return class HOC extends Component {
    componentDidMount() {
      this.setIds();
    }

    getIdValue(id) {
      return RouterUtils.getRouteParams(this.props)[id];
    }

    componentDidUpdate(prevProps) {
      const prevParams = RouterUtils.getRouteParams(prevProps);
      ids.forEach(id => {
        const value = this.getIdValue(id);
        if (value !== prevParams[id]) {
          this.setIds();
        }
      });
    }

    setIds() {
      const payload = ids.reduce(
        (all, id) => ({
          ...all,
          [id]: this.getIdValue(id)
        }),
        {}
      );
      this.props.rootStore.uiStore[uiStoreFunctionName](payload);
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
