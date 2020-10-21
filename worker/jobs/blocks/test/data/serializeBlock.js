'use strict';

const BigInteger = require('bigi');
const {
  Block,
  Transaction,
  Header,
  Output,
  Input,
  Spend,
  Asset,
  Hash,
  ContractId,
  Nonce,
  PK,
  Coinbase,
  Fee,
  ActivationSacrifice,
  Contract,
  ExtensionSacrifice,
  Destroy,
  V0,
} = require('@zen/zenjs');

// number should be a string
function bigi(number) {
  return new BigInteger(number, undefined, undefined);
}

function parseLock(key) {
  let lock = typeof key === 'string' ? key : Object.keys(key)[0];
  switch (lock) {
    case 'PK':
      return new PK(Hash.fromBytes(key.PK.hash));
    case 'Coinbase':
      return new Coinbase(key.Coinbase.blockNumber, Hash.fromBytes(key.Coinbase.pkHash));
    case 'ActivationSacrifice':
      return new ActivationSacrifice();
    case 'Contract':
      return new Contract(ContractId.fromString(key.Contract.id));
    case 'ExtensionSacrifice':
      return new ExtensionSacrifice(ContractId.fromString(key.ExtensionSacrifice.id));
    case 'Destroy':
      return new Destroy();
    case 'Fee':
      return new Fee();
    default:
      throw 'Not Supposed to be here';
  }
}

function parseOutput(output) {
  return new Output(
    parseLock(output.lock),
    new Spend(new Asset(output.spend.asset), output.spend.amount)
  );
}

function parseInput(input) {
  let data = null;
  switch (Object.keys(input)[0]) {
    case 'mint':
      data = { kind: 'mint', spend: new Spend(new Asset(input.mint.asset), input.mint.amount) };
      break;
    case 'outpoint':
      data = {
        kind: 'outpoint',
        txHash: new Hash(input.outpoint.txHash),
        index: input.outpoint.index,
      };
      break;
    case 'pointedOutput':
      //return {kind: 'pointedOutput', outpoint:{kind: 'outpoint', txHash: key.outpoint.txHash, index: key.outpoint.index},output: new Output(parseLock(key.pointedOutput.lock), new Spend(new Asset(key.pointedOutput.spend.asset), key.pointedOutput.spend.amount))}
      throw 'you should not have it in blockchain/block';
  }
  return new Input(data);
}

function parseContract(contract) {
  return new V0({
    code: contract.code,
    hints:
      '["d28b89d60c7a06f36565a2c194d425d3",[["Z2f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0.redeem",1,2,1,["@MaxIFuel_assumption","@query","Prims_pretyping_ae567c2fb75be05905677af440075565","equation_Prims.nat","equation_Prims.op_Star","int_typing","primitive_Prims.op_Addition","primitive_Prims.op_Multiply","projection_inverse_BoxInt_proj_0","refinement_interpretation_Prims_Tm_refine_ba523126f67e00e7cd55f0b92f16681d","typing_Zen.Wallet.size"],0,"0cdafed92db2978ff102576bbe3ba6a1"],["Z2f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0.main",1,2,1,["@MaxIFuel_assumption","@query","Prims_pretyping_ae567c2fb75be05905677af440075565","Zen.Types.Extracted_pretyping_fc7fd22713809b910ef9823c88839bb1","assumption_Prims.HasEq_string","bool_inversion","data_typing_intro_Zen.Types.Extracted.FeeLock@tok","disc_equation_FStar.Pervasives.Native.None","equation_Prims.nat","equation_Prims.op_Star","int_typing","kinding_Zen.Types.Extracted.lock@tok","lemma_FStar.Pervasives.invertOption","primitive_Prims.op_Addition","primitive_Prims.op_Multiply","projection_inverse_BoxBool_proj_0","projection_inverse_BoxInt_proj_0","refinement_interpretation_Prims_Tm_refine_ba523126f67e00e7cd55f0b92f16681d","typing_FStar.Pervasives.Native.uu___is_Some","typing_Zen.Wallet.size"],0,"42611ced44fbfdd6ded2474792d04312"],["Z2f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0.cf",1,2,1,["@MaxIFuel_assumption","@query","equation_Prims.nat","equation_Prims.op_Star","primitive_Prims.op_Addition","primitive_Prims.op_Multiply","projection_inverse_BoxInt_proj_0","refinement_interpretation_Prims_Tm_refine_ba523126f67e00e7cd55f0b92f16681d","typing_Zen.Wallet.size"],0,"dee2c598d2bb60438290bc1ef7ffd41b"],["Z2f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0.mainFunction",1,2,1,["@MaxIFuel_assumption","@query","Prims_pretyping_ae567c2fb75be05905677af440075565","Zen.Cost.Realized_interpretation_Tm_arrow_8f884e5a479333b9416793675b7e962b","Zen.Types.Main_pretyping_5bd8c5a85db081605d2f2b0ef5761cbb","Zen.Types.Main_pretyping_8d0bd552ce32ff91a3c9f4725122e3be","data_typing_intro_Zen.Types.Main.Anonymous@tok","equation_Prims.nat","equation_Prims.op_Star","equation_Z2f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0.cf","equation_Zen.Base.op_Bar_Greater","equation_Zen.Types.Main.maxCost","fuel_guarded_inversion_Zen.Types.Main.context","function_token_typing_Prims.nat","function_token_typing_Zen.Cost.Realized.ret","int_typing","interpretation_Z2f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0_Tm_abs_cdd63e4716516f858623d353b12731f2","lemma_Zen.Cost.Realized.force_inc","lemma_Zen.Cost.Realized.force_ret","primitive_Prims.op_Addition","primitive_Prims.op_Multiply","proj_equation_Zen.Types.Main.CostFunc_f","proj_equation_Zen.Types.Main.CostFunc_n","projection_inverse_BoxInt_proj_0","projection_inverse_Zen.Types.Main.CostFunc_f","projection_inverse_Zen.Types.Main.CostFunc_n","refinement_interpretation_Prims_Tm_refine_ba523126f67e00e7cd55f0b92f16681d","refinement_interpretation_Zen.Types.Main_Tm_refine_8ae4abcfc6bc8d4903b7e1f40e070ec2","string_inversion","token_correspondence_Zen.Cost.Realized.ret","token_correspondence_Zen.Types.Main.__proj__CostFunc__item__f","typing_Zen.Wallet.size"],0,"16e4a439139c09a875ec73649e79e8f1"]]]\n',
    rlimit: 2723280,
    queries: 72,
  });
}

function parseTx(tx) {
  let outputs = tx.outputs.map(parseOutput);
  let inputs = tx.inputs.map(parseInput);
  let contract = tx.contract ? parseContract(tx.contract) : undefined;
  const version = tx.version;
  return new Transaction(version, inputs, outputs, contract);
}

module.exports = function (blockJson) {
  const header = {
    version: blockJson.header.version,
    parent: Hash.fromBytes(blockJson.header.parent),
    blockNumber: blockJson.header.blockNumber,
    commitments: Hash.fromBytes(blockJson.header.commitments),
    timestamp: new BigInteger(blockJson.header.timestamp.toString()),
    difficulty: blockJson.header.difficulty,
    nonce: new Nonce([bigi(blockJson.header.nonce[0]), bigi(blockJson.header.nonce[1])]),
  };

  let transactions = Object.keys(blockJson.transactions).map((key) =>
    parseTx(blockJson.transactions[key])
  );

  const block = new Block({
    header: new Header(header),
    txMerkleRoot: Hash.zero(),
    witnessMerkleRoot: Hash.zero(),
    activeContractSetMerkleRoot: Hash.zero(),
    commitments: [Hash.zero()],
    transactions,
  });

  return block.toHex();
};
