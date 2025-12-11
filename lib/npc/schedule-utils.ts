import type { PostingTimes, ActiveHours, ScheduleMode } from '../queries-npc'

/**
 * Utility functions for calculating random post schedules
 */

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Check if an hour is within the active hours window
 */
function isWithinActiveHours(hour: number, activeHours: ActiveHours): boolean {
  if (activeHours.start <= activeHours.end) {
    // Normal case: e.g., 8am to 10pm
    return hour >= activeHours.start && hour < activeHours.end
  } else {
    // Wrapping case: e.g., 10pm to 6am (night hours)
    return hour >= activeHours.start || hour < activeHours.end
  }
}

/**
 * Get a random hour within the active hours window
 */
function getRandomActiveHour(activeHours: ActiveHours): number {
  const hours: number[] = []
  
  if (activeHours.start <= activeHours.end) {
    // Normal case
    for (let h = activeHours.start; h < activeHours.end; h++) {
      hours.push(h)
    }
  } else {
    // Wrapping case
    for (let h = activeHours.start; h < 24; h++) {
      hours.push(h)
    }
    for (let h = 0; h < activeHours.end; h++) {
      hours.push(h)
    }
  }

  if (hours.length === 0) {
    // Fallback to default hours if none configured
    return randomInt(9, 21)
  }

  return hours[randomInt(0, hours.length - 1)]
}

/**
 * Calculate the next post time based on schedule mode
 */
export function calculateNextPostTime(
  postingTimes: PostingTimes,
  fromDate: Date = new Date()
): Date {
  const activeHours = postingTimes.active_hours || { start: 8, end: 22 }
  const randomizeMinutes = postingTimes.randomize_minutes !== false
  const mode = postingTimes.mode || 'posts_per_day'

  let scheduledTime: Date

  switch (mode) {
    case 'posts_per_day': {
      // Pick a random time today within active hours
      const hour = getRandomActiveHour(activeHours)
      const minute = randomizeMinutes ? randomInt(0, 59) : 0
      
      scheduledTime = new Date(fromDate)
      scheduledTime.setHours(hour, minute, 0, 0)
      
      // If the time has already passed today, schedule for the next active hour
      if (scheduledTime <= fromDate) {
        // Add some random time in the future (1-4 hours)
        const hoursToAdd = randomInt(1, 4)
        scheduledTime = new Date(fromDate.getTime() + hoursToAdd * 60 * 60 * 1000)
        if (randomizeMinutes) {
          scheduledTime.setMinutes(randomInt(0, 59))
        }
      }
      break
    }

    case 'posts_per_week': {
      // Pick a random day and time this week
      const daysToAdd = randomInt(0, 6)
      const hour = getRandomActiveHour(activeHours)
      const minute = randomizeMinutes ? randomInt(0, 59) : 0
      
      scheduledTime = new Date(fromDate)
      scheduledTime.setDate(scheduledTime.getDate() + daysToAdd)
      scheduledTime.setHours(hour, minute, 0, 0)
      
      // Make sure it's in the future
      if (scheduledTime <= fromDate) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }
      break
    }

    case 'variable_interval': {
      // Add random hours between min and max
      const minHours = postingTimes.min_interval_hours || 4
      const maxHours = postingTimes.max_interval_hours || 8
      const hoursToAdd = randomInt(minHours, maxHours)
      
      scheduledTime = new Date(fromDate.getTime() + hoursToAdd * 60 * 60 * 1000)
      
      if (randomizeMinutes) {
        scheduledTime.setMinutes(randomInt(0, 59))
      }
      
      // Adjust if outside active hours
      const hour = scheduledTime.getHours()
      if (!isWithinActiveHours(hour, activeHours)) {
        // Move to next active hour
        scheduledTime.setHours(activeHours.start, randomizeMinutes ? randomInt(0, 59) : 0, 0, 0)
        if (scheduledTime <= fromDate) {
          scheduledTime.setDate(scheduledTime.getDate() + 1)
        }
      }
      break
    }

    default: {
      // Fallback: schedule in 1-4 hours
      const hoursToAdd = randomInt(1, 4)
      scheduledTime = new Date(fromDate.getTime() + hoursToAdd * 60 * 60 * 1000)
      if (randomizeMinutes) {
        scheduledTime.setMinutes(randomInt(0, 59))
      }
    }
  }

  return scheduledTime
}

/**
 * Calculate multiple post times for a batch
 */
export function calculateMultiplePostTimes(
  postingTimes: PostingTimes,
  count: number,
  fromDate: Date = new Date()
): Date[] {
  const times: Date[] = []
  let lastTime = fromDate
  const mode = postingTimes.mode || 'posts_per_day'
  const activeHours = postingTimes.active_hours || { start: 8, end: 22 }
  const randomizeMinutes = postingTimes.randomize_minutes !== false

  if (mode === 'posts_per_day') {
    // Spread posts throughout the day within active hours
    const activeHourCount = activeHours.end > activeHours.start 
      ? activeHours.end - activeHours.start 
      : (24 - activeHours.start) + activeHours.end
    
    const interval = Math.max(1, Math.floor(activeHourCount / count))
    
    for (let i = 0; i < count; i++) {
      let hour = activeHours.start + (i * interval) + randomInt(0, Math.max(0, interval - 1))
      if (hour >= 24) hour = hour - 24
      
      const scheduledTime = new Date(fromDate)
      scheduledTime.setHours(hour, randomizeMinutes ? randomInt(0, 59) : 0, 0, 0)
      
      // Make sure it's in the future
      if (scheduledTime <= fromDate) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }
      
      times.push(scheduledTime)
    }
  } else if (mode === 'posts_per_week') {
    // Spread posts throughout the week
    const daysInterval = Math.max(1, Math.floor(7 / count))
    
    for (let i = 0; i < count; i++) {
      const daysToAdd = (i * daysInterval) + randomInt(0, Math.max(0, daysInterval - 1))
      const hour = getRandomActiveHour(activeHours)
      
      const scheduledTime = new Date(fromDate)
      scheduledTime.setDate(scheduledTime.getDate() + daysToAdd)
      scheduledTime.setHours(hour, randomizeMinutes ? randomInt(0, 59) : 0, 0, 0)
      
      times.push(scheduledTime)
    }
  } else {
    // Variable interval: chain the posts
    for (let i = 0; i < count; i++) {
      const nextTime = calculateNextPostTime(postingTimes, lastTime)
      times.push(nextTime)
      lastTime = nextTime
    }
  }

  // Sort by time
  times.sort((a, b) => a.getTime() - b.getTime())
  
  return times
}

/**
 * Get the number of posts to generate based on schedule mode
 */
export function getPostsToGenerate(postingTimes: PostingTimes): number {
  const mode = postingTimes.mode || 'posts_per_day'
  
  switch (mode) {
    case 'posts_per_day':
      return postingTimes.posts_per_day || 3
    case 'posts_per_week':
      // Generate ~1 day's worth at a time
      return Math.ceil((postingTimes.posts_per_week || 10) / 7)
    case 'variable_interval':
      // Generate a few posts ahead
      return 3
    default:
      return 3
  }
}

