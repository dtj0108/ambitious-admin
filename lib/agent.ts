import { tool, Agent, Runner, withTrace } from "@openai/agents"
import { z } from "zod"

// Tool to execute SQL queries via our API
const executeQuery = tool({
  name: "execute_query",
  description: "Execute a read-only SQL query against the Ambitious Social database to get statistics and data",
  parameters: z.object({
    sql_query: z.string().describe("The SQL SELECT query to execute")
  }),
  execute: async (input: { sql_query: string }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const apiKey = process.env.AGENT_API_KEY
    
    try {
      const response = await fetch(`${baseUrl}/api/execute-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ sql_query: input.sql_query })
      })

      if (!response.ok) {
        const error = await response.json()
        return JSON.stringify({ error: error.error || 'Query failed' })
      }

      const data = await response.json()
      return JSON.stringify(data.results || data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to execute query' })
    }
  }
})

// Main admin agent that handles user queries
const adminAgent = new Agent({
  name: "Ambitious Admin Agent",
  instructions: `You are an AI assistant for the Ambitious Social admin panel. You help administrators query and understand platform data.

## Your Capabilities:
- Answer questions about user statistics (signups, active users, streaks)
- Provide content metrics (posts by type, engagement)
- Query engagement data (likes, comments, shares)
- Help with platform analytics

## Database Schema - profiles table:
- id (uuid) - unique user ID
- username (text) - unique username
- full_name (text) - user's full name
- email (text) - email address
- created_at (timestamp) - when user signed up
- bio (text) - user biography
- current_streak (integer) - current posting streak
- longest_streak (integer) - longest posting streak
- last_post_date (timestamp) - last time they posted
- referral_count (integer) - number of referrals
- is_bot (boolean) - whether account is a bot
- notifications_enabled (boolean) - notifications on/off

## Database Schema - posts table:
- id (uuid) - post ID
- user_id (uuid) - author's user ID
- content (text) - post content
- post_type (text) - win, dream, ask, hangout, intro, general
- created_at (timestamp) - when post was created
- is_hidden (boolean) - moderation status
- likes_count (integer) - number of likes
- comments_count (integer) - number of comments

## Database Schema - comments table:
- id (uuid) - comment ID
- user_id (uuid) - commenter's user ID
- post_id (uuid) - parent post ID
- content (text) - comment text
- created_at (timestamp) - when comment was created

## Database Schema - likes table:
- id (uuid) - like ID
- user_id (uuid) - user who liked
- post_id (uuid) - liked post ID
- created_at (timestamp) - when like was created

## Guidelines:
1. Use the execute_query tool to run SQL queries
2. Only use SELECT queries (the database enforces this)
3. Always LIMIT results to a reasonable number (10-100)
4. Format responses in a clear, readable way
5. If you can't answer something, explain why
6. Be helpful and conversational

## Example Queries:
- "How many users signed up this week?" → SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days'
- "Top 10 users by streak" → SELECT username, current_streak FROM profiles ORDER BY current_streak DESC LIMIT 10
- "Posts by type" → SELECT post_type, COUNT(*) as count FROM posts GROUP BY post_type ORDER BY count DESC`,
  model: "gpt-4o",
  tools: [executeQuery],
  modelSettings: {
    store: false
  }
})

// Workflow input type
export interface ChatInput {
  message: string
}

// Workflow output type
export interface ChatOutput {
  response: string
  error?: string
}

// Run the agent workflow
export async function runAgentChat(input: ChatInput): Promise<ChatOutput> {
  return await withTrace("Admin Chat", async () => {
    try {
      const runner = new Runner()
      
      const result = await runner.run(
        adminAgent,
        [
          { role: "user", content: input.message }
        ]
      )

      if (!result.finalOutput) {
        return {
          response: "I couldn't generate a response. Please try rephrasing your question.",
          error: "No output generated"
        }
      }

      return {
        response: result.finalOutput
      }
    } catch (error) {
      console.error('Agent error:', error)
      return {
        response: "Sorry, I encountered an error processing your request. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}

