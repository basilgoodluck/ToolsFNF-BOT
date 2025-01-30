import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import axios from 'axios';

export class SolanaService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  async getWalletTransactions(walletAddress: string): Promise<ParsedTransactionWithMeta[]> {
    try {
      const pubKey = new PublicKey(walletAddress);
      // Get last 100 signatures
      const signatures = await this.connection.getSignaturesForAddress(
        pubKey,
        { limit: 100 }
      );

      // Get full transaction details
      const transactions = await this.connection.getParsedTransactions(
        signatures.map(sig => sig.signature)
      );

      return transactions.filter((tx): tx is ParsedTransactionWithMeta => tx !== null);
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw new Error('Failed to fetch wallet transactions');
    }
  }

  async getTokenMetadata(tokenAddress: string) {
    try {
      const tokenMint = new PublicKey(tokenAddress);
      const metadataPDA = await this.findMetadataPda(tokenMint);
      const metadata = await Metadata.fromAccountAddress(this.connection, metadataPDA);
      
      return metadata;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      throw new Error('Failed to fetch token metadata');
    }
  }

  private async findMetadataPda(mint: PublicKey): Promise<PublicKey> {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        mint.toBuffer(),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    return pda;
  }
}