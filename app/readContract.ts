import signer from "./../wallet/signer.json";
import id from "./../wallet/id.json";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Wallet } from "@project-serum/anchor";
import { IDL } from "./../target/types/volatility";
import { PROGRAM_ID } from "../client/programIDs";

async function main() {
  const network = clusterApiUrl("devnet");
  const connection = new Connection(network);

  const wallet = new Wallet(Keypair.fromSecretKey(Uint8Array.from(id)));
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

  const account = await program.account.volatility.fetch(
    volatilityKeypair.publicKey
  );
  console.log({ account });
}

main().then(
  () => process.exit(),
  (error) => {
    console.error("Failed to read contract");
    console.error(error);
    process.exit(-1);
  }
);
