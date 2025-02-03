import { SolanaService } from "./solana.js";
import { PriceService } from "./priceService.js";
import { ParsedTransactionWithMeta } from "@solana/web3.js";

interface TokenTransaction {
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: number;
    fees: number;
  }
  
  interface PnLAnalysis {
    tokenName: string;
    totalSpent: number;
    totalFees: number;
    totalSales: number;
    profitSol: number;
    profitUsd: number;
    roi: number;
  }
  
  export class TokenAnalyzer {
    private solanaService: SolanaService;
    private priceService: PriceService;
  
    constructor(rpcUrl: string) {
      this.solanaService = new SolanaService(rpcUrl);
      this.priceService = new PriceService();
    }
  
    async analyzePnL(walletAddress: string, tokenAddress: string): Promise<PnLAnalysis> {
      try {
        const metadata = await this.solanaService.getTokenMetadata(tokenAddress);
        
        const transactions = await this.solanaService.getWalletTransactions(walletAddress);
        
        const tokenTxs = await this.parseTokenTransactions(transactions, tokenAddress);
        
        const currentPrice = await this.priceService.getCurrentPrice(tokenAddress);
        
        const analysis = this.calculatePnL(tokenTxs, currentPrice, metadata.name);
        
        return analysis;
      } catch (error) {
        console.error('Error analyzing PnL:', error);
        throw new Error('Failed to analyze PnL');
      }
    }
  
    private async parseTokenTransactions(
        transactions: ParsedTransactionWithMeta[],
        tokenAddress: string
      ): Promise<TokenTransaction[]> {
        const tokenTxs: TokenTransaction[] = [];
      
        for (const tx of transactions) {
          const preBalances = tx.meta?.preTokenBalances || [];
          const postBalances = tx.meta?.postTokenBalances || [];
      
          const preBalance = preBalances.find(b => b.mint === tokenAddress);
          const postBalance = postBalances.find(b => b.mint === tokenAddress);
      
          if (!preBalance || !postBalance) continue;
      
          const preAmount = Number(preBalance.uiTokenAmount.amount);
          const postAmount = Number(postBalance.uiTokenAmount.amount);
      
          if (preAmount === postAmount) continue; 

          const solSpent = Math.abs(
            (tx.meta?.preBalances?.[0] || 0) - (tx.meta?.postBalances?.[0] || 0)
          ) / 1e9;
          const fees = (tx.meta?.fee || 0) / 1e9;
          
          if (postAmount > preAmount) {
            tokenTxs.push({
              type: 'buy',
              amount: postAmount - preAmount,
              price: solSpent / (postAmount - preAmount),
              timestamp: tx.blockTime || 0,
              fees,
            });
          } else {
            tokenTxs.push({
              type: 'sell',
              amount: preAmount - postAmount,
              price: solSpent / (preAmount - postAmount),
              timestamp: tx.blockTime || 0,
              fees,
            });
          }
        }
      
        return tokenTxs;
      }
      
  
    private calculatePnL(
      transactions: TokenTransaction[],
      currentPrice: number,
      tokenName: string
    ): PnLAnalysis {
      let totalSpent = 0;
      let totalFees = 0;
      let totalSales = 0;
  
      transactions.forEach(tx => {
        if (tx.type === 'buy') {
          totalSpent += tx.amount * tx.price;
          totalFees += tx.fees;
        } else {
          totalSales += tx.amount * tx.price;
        }
      });
  
      const profitSol = totalSales - totalSpent - totalFees;
      const profitUsd = profitSol * currentPrice;
      const roi = ((profitSol / totalSpent) * 100) || 0;
  
      return {
        tokenName,
        totalSpent,
        totalFees,
        totalSales,
        profitSol,
        profitUsd,
        roi
      };
    }
  }