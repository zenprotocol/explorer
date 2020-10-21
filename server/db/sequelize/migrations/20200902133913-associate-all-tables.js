'use strict';

module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.addConstraint('Txs', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'Txs_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Outputs', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'Outputs_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Outputs', {
        fields: ['txId'],
        type: 'foreign key',
        name: 'Outputs_txId_fkey',
        references: {
          table: 'Txs',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Inputs', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'Inputs_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Inputs', {
        fields: ['txId'],
        type: 'foreign key',
        name: 'Inputs_txId_fkey',
        references: {
          table: 'Txs',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Inputs', {
        fields: ['outputId'],
        type: 'foreign key',
        name: 'Inputs_outputId_fkey',
        references: {
          table: 'Outputs',
          field: 'id',
        },
        onDelete: 'set null',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Executions', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'Executions_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Executions', {
        fields: ['txId'],
        type: 'foreign key',
        name: 'Executions_txId_fkey',
        references: {
          table: 'Txs',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Executions', {
        fields: ['contractId'],
        type: 'foreign key',
        name: 'Executions_contractId_fkey',
        references: {
          table: 'Contracts',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Activations', {
        fields: ['contractId'],
        type: 'foreign key',
        name: 'Activations_contractId_fkey',
        references: {
          table: 'Contracts',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Activations', {
        fields: ['txId'],
        type: 'foreign key',
        name: 'Activations_txId_fkey',
        references: {
          table: 'Txs',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('AddressTxs', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'AddressTxs_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('AddressTxs', {
        fields: ['txId'],
        type: 'foreign key',
        name: 'AddressTxs_txId_fkey',
        references: {
          table: 'Txs',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('AssetTxs', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'AssetTxs_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('AssetTxs', {
        fields: ['txId'],
        type: 'foreign key',
        name: 'AssetTxs_txId_fkey',
        references: {
          table: 'Txs',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('RepoVotes', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'RepoVotes_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('RepoVotes', {
        fields: ['executionId'],
        type: 'foreign key',
        name: 'RepoVotes_executionId_fkey',
        references: {
          table: 'Executions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('CgpVotes', {
        fields: ['blockNumber'],
        type: 'foreign key',
        name: 'CgpVotes_blockNumber_fkey',
        references: {
          table: 'Blocks',
          field: 'blockNumber',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('CgpVotes', {
        fields: ['executionId'],
        type: 'foreign key',
        name: 'CgpVotes_executionId_fkey',
        references: {
          table: 'Executions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeConstraint('Txs', 'Txs_blockNumber_fkey'),
      queryInterface.removeConstraint('Outputs', 'Outputs_blockNumber_fkey'),
      queryInterface.removeConstraint('Outputs', 'Outputs_txId_fkey'),
      queryInterface.removeConstraint('Inputs', 'Inputs_blockNumber_fkey'),
      queryInterface.removeConstraint('Inputs', 'Inputs_txId_fkey'),
      queryInterface.removeConstraint('Inputs', 'Inputs_outputId_fkey'),
      queryInterface.removeConstraint('Executions', 'Executions_blockNumber_fkey'),
      queryInterface.removeConstraint('Executions', 'Executions_txId_fkey'),
      queryInterface.removeConstraint('Executions', 'Executions_contractId_fkey'),
      queryInterface.removeConstraint('Activations', 'Activations_contractId_fkey'),
      queryInterface.removeConstraint('Activations', 'Activations_txId_fkey'),
      queryInterface.removeConstraint('AddressTxs', 'AddressTxs_blockNumber_fkey'),
      queryInterface.removeConstraint('AddressTxs', 'AddressTxs_txId_fkey'),
      queryInterface.removeConstraint('AssetTxs', 'AssetTxs_blockNumber_fkey'),
      queryInterface.removeConstraint('AssetTxs', 'AssetTxs_txId_fkey'),
      queryInterface.removeConstraint('RepoVotes', 'RepoVotes_blockNumber_fkey'),
      queryInterface.removeConstraint('RepoVotes', 'RepoVotes_executionId_fkey'),
      queryInterface.removeConstraint('CgpVotes', 'CgpVotes_blockNumber_fkey'),
      queryInterface.removeConstraint('CgpVotes', 'CgpVotes_executionId_fkey'),
    ]);
  },
};
