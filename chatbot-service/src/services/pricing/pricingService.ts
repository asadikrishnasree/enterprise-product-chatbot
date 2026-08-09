interface ModelPricing {
    inputPerMillionTokens: number;
    outputPerMillionTokens: number;
  }
  
  const MODEL_PRICING: Record<string, ModelPricing> = {
    "gpt-5-mini": {
      inputPerMillionTokens: 0.25,
      outputPerMillionTokens: 2,
    },
  };
  
  export interface CostCalculation {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }
  
  export const calculateModelCost = (
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): CostCalculation => {
    const pricing = MODEL_PRICING[model];
  
    if (!pricing) {
      console.warn(
        `Pricing is not configured for model "${model}".`,
      );
  
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
      };
    }
  
    const inputCost =
      (inputTokens / 1_000_000) *
      pricing.inputPerMillionTokens;
  
    const outputCost =
      (outputTokens / 1_000_000) *
      pricing.outputPerMillionTokens;
  
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  };