// NPC Engine - Main exports

export * from './types'
export * from './ai-providers'
export * from './schedule-utils'
export { ContentGenerator } from './content-generator'
export { BehaviorEngine } from './behavior-engine'

// Image generation exports
export { GeminiImageProvider, createGeminiImageProvider, isGeminiConfigured, fetchImageAsBase64 } from './gemini-provider'
export { generateImagePrompt, buildCompleteImagePrompt, generateVisualPersonaFromText, buildReferenceImagePrompt, generateCompleteNPC } from './image-prompt-generator'
export type { GeneratedNPCData, GenerateCompleteNPCRequest } from './image-prompt-generator'
export { uploadNPCImage, deleteNPCImage } from './image-storage'

