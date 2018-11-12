import React, { Component } from 'react';
import RouterUtils from '../../../../lib/RouterUtils';
import uiStore from '../../../../store/UIStore';

export default function WithSetAddressOnUiStore(WrappedComponent, uiStoreFunctionName) {
  return class HOC extends Component {
    componentDidMount() {
      this.setAddress();
    }

    componentDidUpdate(prevProps) {
      const prevParams = RouterUtils.getRouteParams(prevProps);
      if (this.addressProp !== prevParams.address) {
        this.setAddress();
      }
    }

    get addressProp() {
      return RouterUtils.getRouteParams(this.props).address;
    }

    setAddress() {
      uiStore[uiStoreFunctionName]({ address: this.addressProp });
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
