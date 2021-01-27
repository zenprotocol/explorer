# Worker Layer

The worker is responsible for fetching new blocks from the node and insert them in the database.  
The main entry point is the `index.js` file, which requires all the different worker queues.

## Queues
1. **Blocks queue**: the main queue for fetching blocks
2. **Contracts queue** - updates active contracts' expiry block
3. **Executions queue** - Fetches contract executions from addressdb and inserts into the database
4. **Infos queue** - update general infos like software versions from github
5. **Votes queue** - Adds valid CGP/REPO votes
6. **Snapshots queue** - take snapshots for CGP/REPO semesters/intervals
7. **Reorgs scan queue**: search for reorgs in the whole blockchain (currently not in use)

## Run-Once nodejs scripts
in `worker/run-once` are several convenience scripts available,  
each script can be run from the root folder as `node worker/run-once/<name of script>`

1. `insertAllExecutionsForAllExistingContracts`  
insert all executions for each contract in the database

2. `insertAllContractsFromTransactions`   
Go over the whole blockchain, search for contracts and insert them to the database
If the contract already exists - update it  
**available flags**:
   - `-b <block number>` - specify the block to start to search from  

3. `insertVoteIntervals`
Insert REPO vote intervals in batch
```
Usage: insertVoteIntervals [options]

Options:
  -b, --begin      The start block                                               [required] [number]
  -l, --length     The interval length in blocks                                 [required] [number]
  -g, --gap        The gap between intervals in blocks                           [required] [number]
  -a, --amount     The amount of intervals to insert                             [required] [number]
  -t, --threshold  The threshold in Kalapas for a valid candidate                [required] [number]
  -h, --help       Show help                                              [commands: help] [boolean]
```

4. `searchContract`  
Search from last block in node backwards for a transaction with a contract, stops when found.

5. `searchReorg`  
Search the blocks table for reorgs, Will return the first fork it finds  
**available flags**:  
   - -a | --all - search the whole blocks and return all of the found forks

6. `searchTxInBlockInNode`  
Search the node for a block that contains a txHash  
**available flags**:  
   - -t [txHash] - the txHash to search
   - -asc - search from block 1 upwards (defaults to last block downwards)

7. `snapshotIntervals`  
Take snapshots for all intervals that does not have a snapshot yet

8. `recalcAddressesAssetsCurState`  
Recalculates and updates the database with the current state of all addresses and assets.  
Use this script when there is a miss-calculation in these tables or when wanting to reset the database to a certain block number  
Updates data in the following database tables:
   1. Addresses
   2. AddressTxs
   3. Assets
   4. AssetTxs  

   