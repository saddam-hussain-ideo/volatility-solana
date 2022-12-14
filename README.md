# Volatility Program

## Setup project
1. Run command `solana-keygen new -o ./wallet/id.json` to generate authority
2. Run command `solana airdrop 1 <Public Key of id.json>` add devnet solana in account
3. Run command `solana-keygen new -o ./wallet/signer.json` to generate signer account


## To Deploy Project</br>

1. Run command `anchor build`
2. Use command `solana address -k ./target/deploy/volatility-keypair.json` to find `PROGRAM_ID`
3. Update `PROGRAM_ID` in `Anchor.toml | program/volatility/src/lib.rs | client/programIDs` files
4. Run command `anchor deploy`

## To Run Project</br>

```bash
# Install node_modules
$ npm install

# To initialize your account
$ npm run initialize
 
# To add new record and calculate volatility
$ npm run addRecord

# To read values of contract
$ npm run readContract
```
