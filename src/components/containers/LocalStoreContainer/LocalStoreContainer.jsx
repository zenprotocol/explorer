import { Component } from 'react';
import {autorun} from 'mobx';
import {observer} from 'mobx-react';
import PropTypes from 'prop-types';
import localStore from '../../../lib/localStore';

/**
 * Encapsulate local store loading and saving for component data
 * Uses mobx - expects props.data to be observable 
 */
class LocalStoreContainer extends Component {
  componentDidMount() {
    this.loadFromStorage();

    autorun(() => {
      this.saveToStorage();
    });
  }

  saveToStorage() {
    const { data } = this.props;
    localStore.set(this.dataKey, data);
  }

  loadFromStorage() {
    const { keys } = this.props;
    const data = localStore.get(this.dataKey);
    if (data) {
      const keysToLoad = keys? keys : Object.keys(data);
      keysToLoad.forEach((key) => {
        this.props.data[key] = data[key];
      });
    }
  }

  get dataKey() {
    return `${this.props.name}-data`;
  }

  render() {
    return null;
  }
}
LocalStoreContainer.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  keys: PropTypes.array,
};

export default observer(LocalStoreContainer);
