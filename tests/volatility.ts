import * as anchor from "@project-serum/anchor";
import { IDL, Volatility } from "../target/types/volatility";
import { Keypair } from "@solana/web3.js";
import { BTC_PRICE_FEED, PROGRAM_ID } from "../client/programIDs";
import signer from "./../wallet/signer.json";

describe("volatility", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(
    IDL,
    PROGRAM_ID,
    provider,
    new anchor.BorshCoder(IDL)
  ) as anchor.Program<Volatility>;

  const volatilityKeypair = Keypair.generate();

  it("Is initialized!", async () => {
    // The Account to create.

    // Create the new account and initialize it with the program.
    const signature = await program.methods
      .initialize()
      .accounts({
        volatilityAccount: volatilityKeypair.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([volatilityKeypair])
      .rpc();

    const logs = await provider.connection.getParsedTransaction(
      signature,
      "confirmed"
    );

    console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
  });

  it("Add Prices", async () => {
    let signature = await program.methods
      .addPrice()
      .accounts({
        aggregator: BTC_PRICE_FEED,
        volatilityAccount: volatilityKeypair.publicKey,
      })
      .rpc();

    let logs = await provider.connection.getParsedTransaction(
      signature,
      "confirmed"
    );

    console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
    console.log("1st price added waiting for 1.5 min to add next");

    await delay(1000 * 90);

    signature = await program.methods
      .addPrice()
      .accounts({
        aggregator: BTC_PRICE_FEED,
        volatilityAccount: volatilityKeypair.publicKey,
      })
      .rpc();

    logs = await provider.connection.getParsedTransaction(
      signature,
      "confirmed"
    );

    console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
    console.log("2nd price added waiting for 1.5 min to add next");

    await delay(1000 * 90);

    signature = await program.methods
      .addPrice()
      .accounts({
        aggregator: BTC_PRICE_FEED,
        volatilityAccount: volatilityKeypair.publicKey,
      })
      .rpc();

    logs = await provider.connection.getParsedTransaction(
      signature,
      "confirmed"
    );

    console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
    console.log("3rd price added");
  });

  it("Calculate volatility", async () => {
    const signature = await program.methods
      .calculateVolatility()
      .accounts({
        volatilityAccount: volatilityKeypair.publicKey,
      })
      .rpc();

    const logs = await provider.connection.getParsedTransaction(
      signature,
      "confirmed"
    );

    // Fetch the newly updated account.
    const account = await program.account.volatility.fetch(
      volatilityKeypair.publicKey
    );
    console.log({ account });

  });

  /*it("Can read feed", async () => {
        const signature = await program.methods
            .readResult({maxConfidenceInterval: 0.25})
            .accounts({
                aggregator: BTC_PRICE_FEED
            })
            .rpc();
        const logs = await provider.connection.getParsedTransaction(
            signature,
            "confirmed"
        );

        console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
    });*/
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
