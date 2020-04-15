import React, { Component } from 'react';
import RouterUtils from '../../../lib/RouterUtils';

/**
 * Set ids in the UI store automatically
 *
 * @param {*} WrappedComponent
 * @param {*} uiStoreFunctionName
 * @param {[string]} [ids=[]] - a list of ids for the ui table
 * @param {boolean} shouldForceOnMount - should force an update on each mount, false by default
 * @returns HOC
 */
export default function WithSetIdsOnUiStore(
  WrappedComponent,
  uiStoreFunctionName,
  ids = [],
  shouldForceOnMount = false
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
      const changed = ids.some(id => this.getIdValue(id) !== prevParams[id]);
      if (changed) {
        this.setIds();
      }
    }

    setIds() {
      const payload = ids.reduce(
        (all, id) => ({
          ...all,
          [id]: this.getIdValue(id),
        }),
        { force: shouldForceOnMount }
      );
      this.props.rootStore.uiStore[uiStoreFunctionName](payload);
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
