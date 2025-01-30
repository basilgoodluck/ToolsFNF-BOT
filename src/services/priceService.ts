import axios from 'axios'

export class PriceService {
    private readonly jupiterBaseUrl = 'https://price.jup.ag/v4';
  
    async getCurrentPrice(tokenAddress: string): Promise<number> {
      try {
        const response = await axios.get(
          `${this.jupiterBaseUrl}/price?ids=${tokenAddress}`
        );
        
        if (!response.data.data?.[tokenAddress]) {
          throw new Error('Price data not found');
        }
  
        return response.data.data[tokenAddress].price;
      } catch (error) {
        console.error('Error fetching current price:', error);
        throw new Error('Failed to fetch token price');
      }
    }
  
    async getHistoricalPrice(tokenAddress: string, timestamp: number): Promise<number> {
      // Note: Jupiter doesn't provide historical prices directly
      // You might want to use Birdeye API for this
      const response = await axios.get(
        `https://public-api.birdeye.so/public/history_price?address=${tokenAddress}&timestamp=${timestamp}`,
        {
          headers: {
            'X-API-KEY': process.env.BIRDEYE_API_KEY
          }
        }
      );
      
      return response.data.data.value;
    }
  }