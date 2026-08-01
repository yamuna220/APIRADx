// AI Provider Service with provider abstraction
import { AIProvider, VulnerabilityContext, AIRecommendation, RecommendationRequest, RecommendationResponse } from '../types/ai'
import { MockAIProvider } from '../providers/mockAIProvider'

class AIProviderService {
  private provider: AIProvider
  private fallbackProvider: AIProvider

  constructor() {
    // Initialize with mock provider
    this.provider = new MockAIProvider()
    this.fallbackProvider = new MockAIProvider()
  }

  /**
   * Set the active AI provider
   */
  setProvider(provider: AIProvider): void {
    this.provider = provider
  }

  /**
   * Get the current provider name
   */
  getProviderName(): string {
    return this.provider.name
  }

  /**
   * Check if the current provider is available
   */
  isProviderAvailable(): boolean {
    return this.provider.isAvailable()
  }

  /**
   * Generate AI recommendation for a vulnerability
   */
  async generateRecommendation(
    vulnerability: VulnerabilityContext,
    options?: RecommendationRequest['options']
  ): Promise<RecommendationResponse> {
    const startTime = Date.now()

    try {
      // Try primary provider
      if (this.provider.isAvailable()) {
        const recommendation = await this.provider.generateRecommendation(vulnerability)
        const processingTime = Date.now() - startTime

        return {
          recommendation,
          provider: this.provider.name,
          timestamp: new Date().toISOString(),
          processingTime
        }
      }

      // Fallback to backup provider
      if (this.fallbackProvider.isAvailable()) {
        const recommendation = await this.fallbackProvider.generateRecommendation(vulnerability)
        const processingTime = Date.now() - startTime

        return {
          recommendation,
          provider: this.fallbackProvider.name,
          timestamp: new Date().toISOString(),
          processingTime
        }
      }

      throw new Error('No AI provider available')

    } catch (error) {
      // Try fallback on error
      if (this.fallbackProvider.isAvailable() && this.fallbackProvider !== this.provider) {
        const recommendation = await this.fallbackProvider.generateRecommendation(vulnerability)
        const processingTime = Date.now() - startTime

        return {
          recommendation,
          provider: this.fallbackProvider.name,
          timestamp: new Date().toISOString(),
          processingTime
        }
      }

      throw error
    }
  }

  /**
   * Generate recommendations for multiple vulnerabilities
   */
  async generateBatchRecommendations(
    vulnerabilities: VulnerabilityContext[],
    options?: RecommendationRequest['options']
  ): Promise<RecommendationResponse[]> {
    const promises = vulnerabilities.map(vuln =>
      this.generateRecommendation(vuln, options)
    )

    return Promise.all(promises)
  }

  /**
   * Generate recommendation with retry logic
   */
  async generateRecommendationWithRetry(
    vulnerability: VulnerabilityContext,
    options?: RecommendationRequest['options'],
    maxRetries: number = 2
  ): Promise<RecommendationResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateRecommendation(vulnerability, options)
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError || new Error('Failed to generate recommendation after retries')
  }
}

// Singleton instance
export const aiProviderService = new AIProviderService()

// Export for testing
export { AIProviderService }
