// AI Configuration for future Groq SDK integration
export const AIConfig = {
  modelId: 'deepseek-r1-distill-llama-70b',
  defaultParams: {
    temperature: 0.6,
    maxCompletionTokens: 1024,
    topP: 0.95,
    stream: false
  },
  // Placeholder for future Groq API key management
  apiKey: process.env.GROQ_API_KEY || '',
};

// Future expansion: Add methods for API key management, 
// token usage tracking, and other configuration needs
export class AIConfigManager {
  static getConfig() {
    return AIConfig;
  }

  // Placeholder methods for future implementation
  static updateApiKey(apiKey: string) {
    AIConfig.apiKey = apiKey;
  }
}