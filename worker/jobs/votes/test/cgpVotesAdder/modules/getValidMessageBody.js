'use strict';

const MESSAGE_BODY_PAYOUT = {
  dict: [
    [
      'Payout',
      { string: '02011cb4afc2a1dd2c4f857460a7abe3efc67c24881fd33978d8a5f9a4cb25c14ef101000004' },
    ],
    [
      'Signature',
      {
        dict: [
          [
            '026362f82dee835e645eeeba3b7d235b503537d91233c1c28d257f40d8887cd802',
            {
              signature:
                '1b606d8c609d04d0c185cd16c4380d141263c9e44e095621fe6c9497306eed1e3357b49f7940a79f40b1f128b32a3fd2c52fadf522f7f895eb2dcd1128941ff8',
            },
          ],
          [
            '02bf97e00a4fe4f115921ac8b407866c66337281021d6ddf525f845005c582c451',
            {
              signature:
                '973af3e069c714754465c0c8e75bef1acee2496381a8c3e2c9ce0b359420187c0f03c5bb308863f7f5292ca9385f1400bfef0ae883dd24715fb99cc6b5edf60a',
            },
          ],
        ],
      },
    ],
  ],
};
const MESSAGE_BODY_NOMINATION = {
  dict: [
    [
      'Nomination',
      { string: '02011cb4afc2a1dd2c4f857460a7abe3efc67c24881fd33978d8a5f9a4cb25c14ef101000004' },
    ],
    [
      'Signature',
      {
        dict: [
          [
            '026362f82dee835e645eeeba3b7d235b503537d91233c1c28d257f40d8887cd802',
            {
              signature:
                '1b606d8c609d04d0c185cd16c4380d141263c9e44e095621fe6c9497306eed1e3357b49f7940a79f40b1f128b32a3fd2c52fadf522f7f895eb2dcd1128941ff8',
            },
          ],
          [
            '02bf97e00a4fe4f115921ac8b407866c66337281021d6ddf525f845005c582c451',
            {
              signature:
                '973af3e069c714754465c0c8e75bef1acee2496381a8c3e2c9ce0b359420187c0f03c5bb308863f7f5292ca9385f1400bfef0ae883dd24715fb99cc6b5edf60a',
            },
          ],
        ],
      },
    ],
  ],
};
const MESSAGE_BODY_ALLOCATION = {
  // was made in interval 623
  dict: [
    [
      'Signature',
      {
        dict: [
          [
            '02bc3699a0f36fb2352c41c719b9c944ccf8bc9bfae52206847adfd713a0e26d28',
            {
              signature:
                'd1d59164da046cf496ac2e8a274534aec0ad8a54435118f0091a1b964e5142922f0212203ffe82f3304397fdc15fe5663e3d346e96bc9714dfa95b4517747fef',
            },
          ],
          [
            '032f64e7f4d053ff2e24d1fc41075605cda80b68decd222ed47374cfce382395cd',
            {
              signature:
                'f38facf5de7c6c0c5bd26547d8b00bdbcbf45f0e12af5c9719a26e8b5e8e2f805685ae597f298322987f4181a06e385fac0776882eb9771e093082205651d658',
            },
          ],
        ],
      },
    ],
    ['Allocation', { string: '0106' }],
  ],
};
function getValidMessageBody(type) {
  return type === 'Nomination'
    ? JSON.parse(JSON.stringify(MESSAGE_BODY_NOMINATION))
    : type === 'Payout'
    ? JSON.parse(JSON.stringify(MESSAGE_BODY_PAYOUT))
    : JSON.parse(JSON.stringify(MESSAGE_BODY_ALLOCATION));
}

module.exports = getValidMessageBody;
