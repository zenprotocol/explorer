import React from 'react';
import { observer, inject } from 'mobx-react';
import './SyncNotification.scss';

const SyncNotification = inject('rootStore')(
  observer(props => {
    const { syncing } = props.rootStore.uiStore.state;
    const isSyncing = syncing === 'syncing';
    return (
      <div className="SyncNotification">
        <span className={syncing}>
          <i className={isSyncing ? 'icon far fa-spinner-third zen-spin' : 'icon fas fa-circle'} />
          {' ' + getSyncingText(syncing)}
        </span>
      </div>
    );
  })
);

export default SyncNotification;

function getSyncingText(status) {
  switch (status) {
    case 'syncing':
      return 'Syncing...';
    case 'synced':
      return 'Synced.';
    case 'error':
      return 'Not synced.';
    default:
      return '';
  }
}
