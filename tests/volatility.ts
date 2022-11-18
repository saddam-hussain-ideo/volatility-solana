import * as anchor from "@project-serum/anchor";
import {IDL, Volatility} from "../target/types/volatility";
import {PublicKey} from "@solana/web3.js";
import {assert} from "chai";

describe("volatility", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider);

    const BTC_PRICE_FEED = new PublicKey(
        "uXp9uaJFFPiQQmPH4UaXTWfeV9M59AvGwNSS6BppbQ3"
    );
    const PROGRAM_ID = new PublicKey(
        "FKLzkEN4iBf9dPFuxUjvVFZGtEqYXLZgdFn9hxa2sKKq"
    );

    const program = new anchor.Program(
        IDL,
        PROGRAM_ID,
        provider,
        new anchor.BorshCoder(IDL)
    ) as anchor.Program<Volatility>;

    const volatilityKeypair = anchor.web3.Keypair.generate();


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

     it("Add 1st price", async () => {
         const signature = await program.methods
             .addPrice()
             .accounts({
                 aggregator: BTC_PRICE_FEED,
                 volatilityAccount: volatilityKeypair.publicKey,
             })
             .rpc();

         const logs = await provider.connection.getParsedTransaction(
             signature,
             "confirmed"
         );

         console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
     });

    it("Add 2nd price", async () => {
        const signature = await program.methods
            .addPrice()
            .accounts({
                aggregator: BTC_PRICE_FEED,
                volatilityAccount: volatilityKeypair.publicKey,
            })
            .rpc();

        const logs = await provider.connection.getParsedTransaction(
            signature,
            "confirmed"
        );

        console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
    });

    it("Add 3rd price", async () => {
        const signature = await program.methods
            .addPrice()
            .accounts({
                aggregator: BTC_PRICE_FEED,
                volatilityAccount: volatilityKeypair.publicKey,
            })
            .rpc();

        const logs = await provider.connection.getParsedTransaction(
            signature,
            "confirmed"
        );

        console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
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

        console.log(JSON.stringify(logs?.meta?.logMessages, undefined, 2));
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
