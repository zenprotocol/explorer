'use strict';

const MESSAGE_BODY_PAYOUT = {
  dict: [
    [
      'Payout',
      {
        string: '02344dc343f0ac6d0d1d5d6e6388a9dc495ff230b650565455f040c4abd565c1d301000000',
      },
    ],
    [
      'Signature',
      {
        dict: [
          [
            '032229522443cf166e28468c58a4719ce01eb2d9b5b656ecae6e959001bbe8c469',
            {
              signature:
                'b0d63b4a89f53910e82e01b22a3740664ca57756b6304838f8d592008a95047543ba6a281612a41778dc109723c4e4f1937bcbc2fdc847f636a4ff9a9e7d3715',
            },
          ],
          [
            '03c27d63a7a9e2c852b76aee38f51edd07f089a53f43b087ee57811abf61b198b9',
            {
              signature:
                '512f09fccba6b5018ff6ccf899baeee1824862999dcb38948b8406c4fcce1aab361f406c9ce261ebd8d381330f1da487a81cd632671471d7f16803683204fb61',
            },
          ],
        ],
      },
    ],
  ],
};
const MESSAGE_BODY_ALLOCATION = {
  dict: [
    [
      'Signature',
      {
        dict: [
          [
            '032229522443cf166e28468c58a4719ce01eb2d9b5b656ecae6e959001bbe8c469',
            {
              signature:
                '422e4a19b03d9aeeac080c541d390cce33c363d125ca348e1e916cd77404965919d316a4ea1bcbb5bdf3a4d01556512cd674f8334e9f7ac08647274cd7b48b0a',
            },
          ],
          [
            '03c27d63a7a9e2c852b76aee38f51edd07f089a53f43b087ee57811abf61b198b9',
            {
              signature:
                '5a796d7b8577aa7622d4d9cc04fc831c0255426dacfa3b0bab9bd92fbde784cf28b7e6b84208b8f239fec157505c0fe0302de0638203a2f005eb4017d83fa691',
            },
          ],
        ],
      },
    ],
    [
      'Allocation',
      {
        string: '1000',
      },
    ],
  ],
};
function getValidMessageBody(type) {
  return type === 'Payout' ? MESSAGE_BODY_PAYOUT : MESSAGE_BODY_ALLOCATION;
}

module.exports = getValidMessageBody;
