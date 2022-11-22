import signer from "./../wallet/signer.json";
import id from "./../wallet/id.json";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Wallet } from "@project-serum/anchor";
import { IDL } from "./../target/types/volatility";
import { BTC_PRICE_FEED, PROGRAM_ID } from "../client/programIDs";

async function addNewRecord() {
  const network = clusterApiUrl("devnet");
  const connection = new Connection(network);

  const wallet = new Wallet(Keypair.fromSecretKey(Uint8Array.from(id)));
  console.log(wallet.payer.publicKey.toBase58());
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  anchor.setProvider(provider);

  const program = new anchor.Program(
    IDL,
    PROGRAM_ID,
    provider,
    new anchor.BorshCoder(IDL)
  );

  const volatilityKeypair = Keypair.fromSecretKey(Uint8Array.from(signer));

  let addPriceSignature = await program.methods
    .addPrice()
    .accounts({
      aggregator: BTC_PRICE_FEED,
      volatilityAccount: volatilityKeypair.publicKey,
    })
    .rpc();

  let addPriceLogs = await provider.connection.getParsedTransaction(
    addPriceSignature,
    "confirmed"
  );

  console.log(JSON.stringify(addPriceLogs?.meta?.logMessages, undefined, 2));

  const calculateVolatilitySignature = await program.methods
    .calculateVolatility()
    .accounts({
      volatilityAccount: volatilityKeypair.publicKey,
    })
    .rpc();

  let calculateVolatilityLogs = await provider.connection.getParsedTransaction(
    calculateVolatilitySignature,
    "confirmed"
  );

  console.log(
    JSON.stringify(calculateVolatilityLogs?.meta?.logMessages, undefined, 2)
  );
}

addNewRecord().then(
  () => process.exit(),
  (error) => {
    console.error("Failed to add new price");
    console.error(error);
    process.exit(-1);
  }
);
