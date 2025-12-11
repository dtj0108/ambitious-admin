// NPC Engine - Main exports

export * from './types'
export * from './ai-providers'
export * from './schedule-utils'
export { ContentGenerator } from './content-generator'
export { BehaviorEngine } from './behavior-engine'

// Image generation exports
export { GeminiImageProvider, createGeminiImageProvider, isGeminiConfigured } from './gemini-provider'
export { generateImagePrompt, buildCompleteImagePrompt } from './image-prompt-generator'
export { uploadNPCImage, deleteNPCImage } from './image-storage'

