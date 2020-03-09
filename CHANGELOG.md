# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
