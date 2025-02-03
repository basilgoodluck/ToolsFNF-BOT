import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

interface TokenMetadata {
  name: string;
  symbol?: string;
  uri?: string;
}

export class SolanaService {
  private connection: Connection;
  private metaplex: Metaplex;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
    this.metaplex = new Metaplex(this.connection);
  }

  async getWalletTransactions(walletAddress: string): Promise<ParsedTransactionWithMeta[]> {
    try {
      if (!this.isValidPublicKey(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const pubKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(
        pubKey,
        { limit: 100 }
      );

      const transactions = await this.connection.getParsedTransactions(
        signatures.map(sig => sig.signature)
      );

      return transactions.filter((tx): tx is ParsedTransactionWithMeta => tx !== null);
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw new Error('Failed to fetch wallet transactions');
    }
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    try {
      if (!this.isValidPublicKey(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const mintAddress = new PublicKey(tokenAddress);

      try {
        const nft = await this.metaplex.nfts().findByMint({ mintAddress });
        return {
          name: nft.name,
          symbol: nft.symbol,
          uri: nft.uri
        };
      } catch (error) {
        return {
          name: `Token ${tokenAddress.slice(0, 4)}...${tokenAddress.slice(-4)}`,
          symbol: 'UNKNOWN'
        };
      }
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {
        name: `Token ${tokenAddress.slice(0, 4)}...${tokenAddress.slice(-4)}`,
        symbol: 'UNKNOWN'
      };
    }
  }

  private isValidPublicKey(key: string): boolean {
    try {
      new PublicKey(key);
      return true;
    } catch {
      return false;
    }
  }
}