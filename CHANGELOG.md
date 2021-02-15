# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.1.0](https://github.com/zenprotocol/explorer/compare/v4.0.2...v4.1.0) (2021-02-15)


### Features

* calc assets & addresses cur state ([3f4a92e](https://github.com/zenprotocol/explorer/commit/3f4a92e11b910cbd28b7dca620942cc3a14bb789))
* show all asset amounts in divided unit ([3774bd3](https://github.com/zenprotocol/explorer/commit/3774bd3933ac3ffb206fd50773b3f068fb3b1291))
* show comma as thousand separator in chart tooltips ([789d691](https://github.com/zenprotocol/explorer/commit/789d691318993298d20c5e322eb3a053ebae90d6))
* show contract name ([2cf6d46](https://github.com/zenprotocol/explorer/commit/2cf6d46adc3142057fb135ef049882cd914c97f1))
* show contract name in asset pages ([9734985](https://github.com/zenprotocol/explorer/commit/9734985d28198c0cc3f819f84a864384d0681d33))
* show empty addresses ([c5c662c](https://github.com/zenprotocol/explorer/commit/c5c662c33d1a886d9f41ca376217268228b84aab))
* take care of change in address balance calc ([14c4228](https://github.com/zenprotocol/explorer/commit/14c4228d8b94a972e918f6fc17725d43c1dd9ef3))
* **governance:** add a prev interval route ([e59c22c](https://github.com/zenprotocol/explorer/commit/e59c22cef12f4875fbe63037c0a42b429df96098))
* **governance:** change route to current-next-or-prev ([bf76a69](https://github.com/zenprotocol/explorer/commit/bf76a691c3ef387bcc68691e143ae1c86f3e08a3))
* **governance:** change valid vote range ([bac21c2](https://github.com/zenprotocol/explorer/commit/bac21c2ffebb945a12938bcf41d7f313ce18ebaa))
* **governance:** show if result is above threshold ([e7537ed](https://github.com/zenprotocol/explorer/commit/e7537ed8c882b4aa9dc0f8543ff523e106df9c63))
* truncate commits to 1st 7 chars ([44ef8a1](https://github.com/zenprotocol/explorer/commit/44ef8a156a37fea90d00c46e4f27ee41981bc68d))
* **governance:** find interval by interval and phase ([d776cc8](https://github.com/zenprotocol/explorer/commit/d776cc878316d7db189bce33ce04f687792217d3))
* truncate hashes more meaningfully ([2b6a66b](https://github.com/zenprotocol/explorer/commit/2b6a66b0ea74ea0f75538f1773e1f3cf2f23e176))


### Bug Fixes

* add missing infoStore in tx page ([799da95](https://github.com/zenprotocol/explorer/commit/799da9517fd3491ce254557986e79c9634ccd2b4))
* make sure threshold has a value ([e5a7a19](https://github.com/zenprotocol/explorer/commit/e5a7a193ef6633feb7cde24f81bfdcb7b4593bb5))
* **governance:** get right winner ([0c78c38](https://github.com/zenprotocol/explorer/commit/0c78c38a940bd2746ce9426ae387856cdbdc53cf))
* **governance:** show on-going candidate amount ([5c03de5](https://github.com/zenprotocol/explorer/commit/5c03de5ac30785cdaf4ec912fc80769b60eb0383))
* handle truncation of all zeros hash ([20d8fb6](https://github.com/zenprotocol/explorer/commit/20d8fb64e2813e07dfb643177cb7b7b164e56f67))
* load new address txs when change address ([abf137f](https://github.com/zenprotocol/explorer/commit/abf137fbb9d9a05bf864310f0046203cce5e3adc))
* pass commit id to commit link ([35da49f](https://github.com/zenprotocol/explorer/commit/35da49ffdaf460595294fd7aca21f9950708df93))
* relace history when redirect on exact search ([28fde1c](https://github.com/zenprotocol/explorer/commit/28fde1cc3ed6013dd4a39906456cf229bd2ffaa0))
* show dropdown above copy buttons ([1a6a24e](https://github.com/zenprotocol/explorer/commit/1a6a24e657f8822099028a764102c283ae36b547))

### [4.0.2](https://github.com/zenprotocol/explorer/compare/v4.0.1...v4.0.2) (2020-11-17)


### Bug Fixes

* load new address txs when change address ([4df7b41](https://github.com/zenprotocol/explorer/commit/4df7b414b3553f61da70c1162427546c3f47a5f4))
* make sure right asset txs are loaded ([b6f7dc1](https://github.com/zenprotocol/explorer/commit/b6f7dc10ede613de60b1fd99ffa1a10c42bf7430))
* prevent error when browsing between addresses ([9f00f7b](https://github.com/zenprotocol/explorer/commit/9f00f7bce0a136f88f1d5ec912b669cc08d6c4de))
* take care of null in dal.toJSON ([1b7fa2b](https://github.com/zenprotocol/explorer/commit/1b7fa2b437154e577bb8ec6721706c849ad7b020))

### [4.0.1](https://github.com/zenprotocol/explorer/compare/v4.0.0...v4.0.1) (2020-10-23)


### Bug Fixes

* find address even if balance is 0 ([096eea9](https://github.com/zenprotocol/explorer/commit/096eea94120a5a2862a2cd3df2948e21681df14c))

## [4.0.0](https://github.com/zenprotocol/explorer/compare/v3.2.1...v4.0.0) (2020-10-22)


### ⚠ BREAKING CHANGES

* remove prevPhaseId from RepoVoteIntervals

### Features

* add data to new tables ([c09d16b](https://github.com/zenprotocol/explorer/commit/c09d16be9d2b2566e920e8ad52e4285e9a42081b))
* add executions of all contracts every 12h ([79b870f](https://github.com/zenprotocol/explorer/commit/79b870f313d0ca85404fe78e38fcfa7a5c5fe56e))
* calc reward instead f get from node ([5390bdf](https://github.com/zenprotocol/explorer/commit/5390bdf53aff7286e421125e328ba05102878f67))
* change contracts status column ([5181888](https://github.com/zenprotocol/explorer/commit/5181888aaee3d175ffe5c03acee51ae8f64d823a))
* change txs representation in all pages ([ca8de18](https://github.com/zenprotocol/explorer/commit/ca8de1810bd85880efd9bb684a25355fd70bbe3f))
* get batch of blocks from blockchain/blocks api ([1570053](https://github.com/zenprotocol/explorer/commit/15700532f607a09d68e946ef2facf3c69284f927))
* insert and use difficulty per day ([308c1dd](https://github.com/zenprotocol/explorer/commit/308c1ddc278f95272f06372cd0f5e0c52f01df1a))
* insert and use zp supply table ([d424bf7](https://github.com/zenprotocol/explorer/commit/d424bf76bd4a65c5093bfb583ca15499cc60d8cd))
* insert data and display from TxsPerDay table ([06288ec](https://github.com/zenprotocol/explorer/commit/06288ec63e8b7d13fa674347a5e8e443284d3222))
* move activation column in contracts page ([e712811](https://github.com/zenprotocol/explorer/commit/e712811728eaeaf4891ad8079f625b51a1b87997))
* prepare for new api by get blocks in batch ([3027062](https://github.com/zenprotocol/explorer/commit/3027062450faed399ac85178b826f5202d0674f6))
* prevent insert double repo votes to db ([4cd8c48](https://github.com/zenprotocol/explorer/commit/4cd8c484a5bfa840df7d0fb3b1d46afe451d1a6b))
* prevent insert double votes into the db ([f7aa651](https://github.com/zenprotocol/explorer/commit/f7aa651e103ad655e5cbd1af2e45227258d3aa68))
* save stats in infos table ([cadf9e3](https://github.com/zenprotocol/explorer/commit/cadf9e30d0b1869dc414e550d8a696c1a8bf04fd))
* set extra data for contracts ([cc68c73](https://github.com/zenprotocol/explorer/commit/cc68c73fb06be81376ef904a3ad50a9ba079b9b3))
* show cgp interval 1414 as 1 on testnet ([cc4f710](https://github.com/zenprotocol/explorer/commit/cc4f710349d3eee81921e57fe20bbc9d236f1281))
* show chart data up to yesterday ([60bf9c1](https://github.com/zenprotocol/explorer/commit/60bf9c12eacd18e1b0f8e2ca8e0d2aebe729b41c))
* show only positive balances and order ([604958e](https://github.com/zenprotocol/explorer/commit/604958efd20cf2ddc9e9c31fe3a21876a92e9f43))
* show pkHash in Address page ([e9081c0](https://github.com/zenprotocol/explorer/commit/e9081c04af1537e2604013a81f489a7bbbc524eb))
* sort contracts table by activation by default ([3689e8c](https://github.com/zenprotocol/explorer/commit/3689e8c3cce5596ff23d5953312b2e106b2e85de))
* update infos in blocks job ([6eb855e](https://github.com/zenprotocol/explorer/commit/6eb855efd58a3401218a38dff8a77a5c31919991))
* **cgp:** show mainnet interval 25 as 1st in UI ([f477b91](https://github.com/zenprotocol/explorer/commit/f477b912b3b076ac251c3a78a5d7e40421a169c2))


### Bug Fixes

* **cgp:** set 25th interval as 1st in SSR ([d9091e7](https://github.com/zenprotocol/explorer/commit/d9091e7251ea0e7f08e399652184bfcee3f991e6))
* add repo votes in batches per interval ([91e53f7](https://github.com/zenprotocol/explorer/commit/91e53f70f1cd002fb701d3a5c61b64efaec73f19))
* add zp reward to issued once per block ([eee2025](https://github.com/zenprotocol/explorer/commit/eee2025beb66f7e9bc477da44e58223f204bbb72))
* calculate balance from the right lock types ([de98fe1](https://github.com/zenprotocol/explorer/commit/de98fe18ca8dcf308973cdfcdac497e1a50e503f))
* display transactions count ([9364173](https://github.com/zenprotocol/explorer/commit/936417383c2a10fffc7e934ad7b71bdb1413e404))
* extra parenthesis in nonce ([e8742d1](https://github.com/zenprotocol/explorer/commit/e8742d15d34b236a642eebce27e6f243679339a9))
* get the right fields for conract executions ([84771c7](https://github.com/zenprotocol/explorer/commit/84771c7418a5bf66115fd85f4324d7ea8c41effa))
* return cgpBalance properly from api ([3c8cbfe](https://github.com/zenprotocol/explorer/commit/3c8cbfe62e90c2d580e4c4575d424212eddf6b5c))
* revert asset and address on reorg ([cce84f0](https://github.com/zenprotocol/explorer/commit/cce84f06f595999a08fa4f2141a729bf076413af))
* revert charts data on reorg ([d8d6755](https://github.com/zenprotocol/explorer/commit/d8d6755822aca73391203c1da5d6de095ff3be08))
* **cgp:** wait for nomination winner promise ([07a6824](https://github.com/zenprotocol/explorer/commit/07a6824cd084a06b91452e2582eda759514596fa))
* save the right hash rate to infos ([edd0f4a](https://github.com/zenprotocol/explorer/commit/edd0f4a19ed36ba81baf693b9ec25c2801314030))
* **charts:** return results ordered by date ([143385c](https://github.com/zenprotocol/explorer/commit/143385c0dc3433e2f7fd98e64fcc8221f84c73fd))


* remove prevPhaseId from RepoVoteIntervals ([c74e5b7](https://github.com/zenprotocol/explorer/commit/c74e5b7efa4a4b7fa47a9e7ec8769c13960ec7e6))

### [3.2.1](https://github.com/zenprotocol/explorer/compare/v3.2.0...v3.2.1) (2020-08-17)


### Bug Fixes

* **cgp:** add payout ballot before amount calc ([a65a5d2](https://github.com/zenprotocol/explorer/commit/a65a5d269c98d06bf62bbd514a12d8ae64a3f9d4))

## [3.2.0](https://github.com/zenprotocol/explorer/compare/v3.1.2...v3.2.0) (2020-08-13)


### Features

* **governance:** reload interval on block change ([0ff6687](https://github.com/zenprotocol/explorer/commit/0ff6687b007df6d6257a37bee84b92daae7e2741))
* add icons and splash screens ([03e8eb5](https://github.com/zenprotocol/explorer/commit/03e8eb5ef8726e4d370b4ff54cdf617b188726df))
* refresh address page on blocks change ([f0453ba](https://github.com/zenprotocol/explorer/commit/f0453bab3bba6463f43e9e930a4f69557dceeeb1))
* refresh asset page on blocks change ([477eea0](https://github.com/zenprotocol/explorer/commit/477eea0267b7d971fcf10aa2e380d582cf1a4c25))
* refresh assets page on blocks change ([9a7bf07](https://github.com/zenprotocol/explorer/commit/9a7bf074242ef80db3a88fab5d68672cc29113a3))
* refresh chart on blocks change ([10af3e8](https://github.com/zenprotocol/explorer/commit/10af3e868ee221cbd4dbe8049c14e453a5fbece1))
* refresh chart on blocks change ([a886c3d](https://github.com/zenprotocol/explorer/commit/a886c3df774473f679bb1583057cf67c840e1389))
* refresh contract page on blocks change ([48c07ec](https://github.com/zenprotocol/explorer/commit/48c07ec76bde676cf47d085e912743bd3df2750d))
* refresh search page on blocks change ([8167875](https://github.com/zenprotocol/explorer/commit/816787597315d1c5eeec1af20a2abdb0ed997049))


### Bug Fixes

* allow info boxes to wrap ([1f4f170](https://github.com/zenprotocol/explorer/commit/1f4f170eca20d040b941cfda2ac9ac6c80113484))
* make confirmations reactive ([80bd39f](https://github.com/zenprotocol/explorer/commit/80bd39fef62aacd641173cf6418efdf240f268df))
* make stats btns a bit larger ([34e3cb6](https://github.com/zenprotocol/explorer/commit/34e3cb6f24456d28d96c51b60563a9b8a58cedfb))

### [3.1.2](https://github.com/zenprotocol/explorer/compare/v3.1.1...v3.1.2) (2020-05-22)


### Bug Fixes

* format number ([d6355c7](https://github.com/zenprotocol/explorer/commit/d6355c7528a4bab555eb07ac5daba1ea29df4293))

### [3.1.1](https://github.com/zenprotocol/explorer/compare/v3.1.0...v3.1.1) (2020-05-22)


### Bug Fixes

* count balance by specific lock types ([93faf2a](https://github.com/zenprotocol/explorer/commit/93faf2ae1747ecdf57f87f86377b12040bfaf615))

## [3.1.0](https://github.com/zenprotocol/explorer/compare/v3.0.0...v3.1.0) (2020-04-22)


### Features

* do not return stack error on production ([2b0f6cc](https://github.com/zenprotocol/explorer/commit/2b0f6cc717b5a4f2ca3bb22146ff103e1ff15d76))


### Bug Fixes

* change cgp threshold to 3% on testnet ([75f4d0a](https://github.com/zenprotocol/explorer/commit/75f4d0ab93b33578373851b7e46bc2bbfbbad7a9))
* **governance:** return default commit in relevant ([19a501e](https://github.com/zenprotocol/explorer/commit/19a501e7b676b33e5e36fac2905fa24bfe4ef87d))

## [3.0.0](https://github.com/zenprotocol/explorer/compare/v2.2.1...v3.0.0) (2020-04-15)


### ⚠ BREAKING CHANGES

* /api/cgp/relevant?interval= result change

### Features

* **cgp:** validate spends ordered and unique ([c12703d](https://github.com/zenprotocol/explorer/commit/c12703d0abecd99254396e169904f208b35c92ee))
* add allocation info box ([4266662](https://github.com/zenprotocol/explorer/commit/4266662ecb697fc0ee41625f923fe9cb76bef556))
* add cgp ballot to participants ([399d584](https://github.com/zenprotocol/explorer/commit/399d584744d8ab3938a84c1eacf66d087bac50ba))
* calc allocation, fix fee display in blocks ([532c52b](https://github.com/zenprotocol/explorer/commit/532c52bfbf62d2e228c13377cb8f60095064ab7e))
* change cgp UI to accept phases ([8dec8e3](https://github.com/zenprotocol/explorer/commit/8dec8e38b080648328fbf1e644397492f937e4ad))
* extract genesis total to env var ([0132a2c](https://github.com/zenprotocol/explorer/commit/0132a2c7c770f6e8f364bbbcf20bdef382632087))
* improve cgp worker logs ([5a37df5](https://github.com/zenprotocol/explorer/commit/5a37df5411cd1218dca4c8165cddae3dc1766dac))
* match node in cgp winner calc ([077176c](https://github.com/zenprotocol/explorer/commit/077176c9d74ae3771ff97fedc57b6154c09d91fd))
* move phases 1 block backwards ([bc4099d](https://github.com/zenprotocol/explorer/commit/bc4099d9744a7ccde0708653ffe4ea5de4bd7044))
* return cgp balance at snapshot block ([610306a](https://github.com/zenprotocol/explorer/commit/610306ad43aa5246904642bdd01a176560eb411d))
* return cgp contract id and address in infos ([45576d7](https://github.com/zenprotocol/explorer/commit/45576d762c3874f8eabec9ecd583d767b66acd0c))
* show allocation  bounce during vote ([07a95b2](https://github.com/zenprotocol/explorer/commit/07a95b23d215f2b07b559b2d9d434d89b225def3))
* show cgp balance and allocation info page ([31adc0f](https://github.com/zenprotocol/explorer/commit/31adc0fdb3d93572107e9b4b6258ea42f996154e))
* show extra assets in cgp balance as link ([7fdeeee](https://github.com/zenprotocol/explorer/commit/7fdeeeecfa6c5d8dc008233222aeb1ca2bcacfd1))
* switch to Vote phase in real time ([c8156ad](https://github.com/zenprotocol/explorer/commit/c8156ad7dd4b5a46e321bf9a31c99232aeff2069))
* **cgp:** add phases to backend ([8d114b6](https://github.com/zenprotocol/explorer/commit/8d114b620f12b767c6e87a453b3ac3f34750191c))
* **cgp:** aggregate same assets in payout spends ([a5b5f01](https://github.com/zenprotocol/explorer/commit/a5b5f01487f09e0dc5b5186b214c6b428c63f130))
* **cgp:** change vote begins message ([0cba4be](https://github.com/zenprotocol/explorer/commit/0cba4be23d4802b318d30139642f73fe3403fa51))
* **cgp:** show unconfirmed before maturity ([0921fe9](https://github.com/zenprotocol/explorer/commit/0921fe9ee2982e4b0ea776b6e55cc00637270ed6))


### Bug Fixes

* allocation bounce ([92826b5](https://github.com/zenprotocol/explorer/commit/92826b5b57d23e617747e2d88f6c967f1334df94))
* allow contract ballot and check cgp ballot ([926c11f](https://github.com/zenprotocol/explorer/commit/926c11fca1997d319068f6c2fd0bf949bf21e8b3))
* redirect to phase 0 on page load for SSR ([5d3f5d3](https://github.com/zenprotocol/explorer/commit/5d3f5d3d51b721a7038e783565871f7f7498553c))
* replace cgp address with the fund in page ([19d0885](https://github.com/zenprotocol/explorer/commit/19d0885c530ee5ada56e25d68d817b8118b04f6f))
* show next interval in dropdown only if past maturity ([3aa7674](https://github.com/zenprotocol/explorer/commit/3aa76742008daf4b76dba973fd6f89b3276fb48f))
* ssr with interval 0 ([1a38b91](https://github.com/zenprotocol/explorer/commit/1a38b91a14ce6c9072e34df201959e28c89d73d0))
* start commands queue after every blocks job ([27943ae](https://github.com/zenprotocol/explorer/commit/27943aea5a049b6bacfe23b6527b0e667716f474))
* **cgp:** load data on pagination ([52d8127](https://github.com/zenprotocol/explorer/commit/52d8127d16bc5144e624aac9fb534a1473881d5d))

### [2.2.1](https://github.com/zenprotocol/explorer/compare/v2.2.0...v2.2.1) (2020-04-03)


### Bug Fixes

* remove leftover forceDisposer ([79019f4](https://github.com/zenprotocol/explorer/commit/79019f4dcfd59cc20c2ba14936b121dacd6e581f))

## [2.2.0](https://github.com/zenprotocol/explorer/compare/v2.1.0...v2.2.0) (2020-03-30)


### Features

* return default commit id in votes/candidates ([fd5b2de](https://github.com/zenprotocol/explorer/commit/fd5b2de479416bf9bf58b9f692da5989000d6461))
* **governance:** allow vote for default commit ([e4fe787](https://github.com/zenprotocol/explorer/commit/e4fe787de2b0eee39eedfd11bbc8a59d39c35126))

## [2.1.0](https://github.com/zenprotocol/explorer/compare/v2.0.0...v2.1.0) (2020-03-24)


### Features

* log app name to slack ([546dc34](https://github.com/zenprotocol/explorer/commit/546dc34e81665945d439c8c4b92698252655b509))
* **worker:** add a job to check if blocks synced ([298d1ab](https://github.com/zenprotocol/explorer/commit/298d1ab74883d45e2d2af637bada5d7161a1d244))

## [2.0.0](https://github.com/zenprotocol/explorer/compare/v1.7.13...v2.0.0) (2020-03-09)


### ⚠ BREAKING CHANGES

* support phases in governance on the backend

### Features

* always return infos in ssr ([635baf7](https://github.com/zenprotocol/explorer/commit/635baf77036f5f87f186dc934e3ae2e7550ebc43))
* hide 0 address balance ([8e8f26e](https://github.com/zenprotocol/explorer/commit/8e8f26e823033cb57f439485d9438db04a9791e4))
* return only positive address balance ([2752025](https://github.com/zenprotocol/explorer/commit/2752025dac3be6eadb1bf4b50cdaf5fc03735d57))
* **governance:** add current-or-next route ([6133d97](https://github.com/zenprotocol/explorer/commit/6133d974d4bed2cf78f500495c06d7406e3a72f7))
* **governance:** display phase under title ([f51e184](https://github.com/zenprotocol/explorer/commit/f51e184ccebceebb13c93940c64b6b906b68cbdd))
* **governance:** get all intervals from recent ([57ce191](https://github.com/zenprotocol/explorer/commit/57ce191f5089c3b214656f21844d9e08b72b0eed))
* **governance:** show no eligible cadidates message ([f86df41](https://github.com/zenprotocol/explorer/commit/f86df41c7f95f06fda4689cab4c7c04b854232f7))
* **governance:** show threshold in contestant phase ([3da728f](https://github.com/zenprotocol/explorer/commit/3da728fc9acfe439f9d43dfbda19de64834d3cab))
* add env vars for cors ([5170bbd](https://github.com/zenprotocol/explorer/commit/5170bbd062af4a8c7a75a8a133e1e450892ddf20))
* add thousand separator to all numbers ([449ebe0](https://github.com/zenprotocol/explorer/commit/449ebe0034be6f999fec8a7b2fba6d9734898245))
* calculate total zp properly ([2982a23](https://github.com/zenprotocol/explorer/commit/2982a23731ba500bf921aaac5c74f0a508304076))
* make sure phase is valid ([8131c7e](https://github.com/zenprotocol/explorer/commit/8131c7e12d468acdd298c316f95aed95c60bcb0f))
* poll for votes/results and update on mount ([cfb1597](https://github.com/zenprotocol/explorer/commit/cfb159790443d1091032ed1c0b682d0b457f1214))
* remove trailing zeros in decimal part ([61442e3](https://github.com/zenprotocol/explorer/commit/61442e39eb2f5add13898b7f07ebf45c391a8451))
* **ui:** support phase in governance ([16f782c](https://github.com/zenprotocol/explorer/commit/16f782cc333413cadee7d43e43494b91f1430a92))
* support phases in governance on the backend ([de5e847](https://github.com/zenprotocol/explorer/commit/de5e8471910b98513537b853bb63178a671d9f71))


### Bug Fixes

* **governance:** use interval1 cache in SSR ([fc0d4e4](https://github.com/zenprotocol/explorer/commit/fc0d4e446751cf0dad7728ecb92331a62cec8d99))
* return empty array when address has no balance ([c0710f3](https://github.com/zenprotocol/explorer/commit/c0710f3f5a04e63ec038788f0a2c7e4df50c4dee))
* **governance:** always show formatted text in dropdown ([9bbc0e1](https://github.com/zenprotocol/explorer/commit/9bbc0e156ac549bbb91469be57e04d9e8b30c57c))
* **worker:** start commands job after every blocks job ([d707648](https://github.com/zenprotocol/explorer/commit/d70764892f29724984a1cb32a37807cefa26ff93))
* load blocks only once on change ([eb63a79](https://github.com/zenprotocol/explorer/commit/eb63a795df2214ca01d26c3ede1b019778555990))
* **governance:** return same structure from interval1 cache ([3e98aec](https://github.com/zenprotocol/explorer/commit/3e98aeccf705b5a47bee23a3ae30bc40e87bf6f1))
* remove unused import ([6bdb73c](https://github.com/zenprotocol/explorer/commit/6bdb73c3266389f244763e2b2828195aa786e34e))
* replace clearInterval with clearTimeout ([7a283bf](https://github.com/zenprotocol/explorer/commit/7a283bf35e521374b0af9a0f17da7fbc13bde594))
* use correct total zp in zpRichList and stats ([f810db8](https://github.com/zenprotocol/explorer/commit/f810db8f8ef2f70a392df4123304a9c152b49701))
