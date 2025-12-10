// Profile Tags - Categories and tags for user profiles
// Based on the Ambitious Social app's tag system

export interface TagCategory {
  name: string
  tags: string[]
}

export const PROFILE_TAG_CATEGORIES: TagCategory[] = [
  {
    name: 'Entrepreneurship & Business',
    tags: [
      'Entrepreneurship', 'Startups', 'Small Business', 'E-commerce', 'SaaS',
      'Bootstrapping', 'Venture Capital', 'Angel Investing', 'Business Strategy',
      'Scaling', 'Exit Strategy', 'Acquisitions', 'Franchising', 'Consulting',
      'Business Development', 'Partnerships', 'B2B', 'B2C', 'D2C', 'Marketplace',
      'Side Hustle', 'Solopreneur', 'Serial Entrepreneur', 'First-Time Founder',
    ],
  },
  {
    name: 'Finance & Investing',
    tags: [
      'Investing', 'Stock Market', 'Crypto', 'Bitcoin', 'Ethereum', 'DeFi',
      'NFTs', 'Real Estate', 'REITs', 'Options Trading', 'Day Trading',
      'Swing Trading', 'Long-Term Investing', 'Dividend Investing', 'Index Funds',
      'Wealth Management', 'Financial Planning', 'Budgeting', 'Debt Freedom',
      'FIRE Movement', 'Passive Income', 'Alternative Investments', 'Commodities',
    ],
  },
  {
    name: 'Mindset & Performance',
    tags: [
      'Mindset', 'Growth Mindset', 'Mental Health', 'Meditation', 'Mindfulness',
      'Stoicism', 'Philosophy', 'Peak Performance', 'Flow State', 'Focus',
      'Discipline', 'Habits', 'Morning Routine', 'Journaling', 'Gratitude',
      'Visualization', 'Goal Setting', 'Accountability', 'Self-Awareness',
      'Emotional Intelligence', 'Resilience', 'Confidence', 'Motivation',
    ],
  },
  {
    name: 'Software & Tech',
    tags: [
      'Tech', 'Software Engineering', 'Web Development', 'Mobile Development',
      'iOS', 'Android', 'React', 'React Native', 'Flutter', 'Swift', 'Kotlin',
      'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Node.js', 'Next.js',
      'Backend', 'Frontend', 'Full Stack', 'DevOps', 'Cloud Computing', 'AWS',
      'Google Cloud', 'Azure', 'Databases', 'APIs', 'Microservices', 'No-Code',
      'Low-Code', 'Open Source', 'Cybersecurity', 'Blockchain Development',
    ],
  },
  {
    name: 'Creativity & Design',
    tags: [
      'Design', 'UI Design', 'UX Design', 'Product Design', 'Graphic Design',
      'Brand Design', 'Logo Design', 'Typography', 'Illustration', 'Animation',
      '3D Design', 'Motion Graphics', 'Figma', 'Sketch', 'Adobe Creative Suite',
      'Photography', 'Videography', 'Film', 'Music Production', 'Podcasting',
      'Writing', 'Copywriting', 'Creative Writing', 'Storytelling', 'Art',
    ],
  },
  {
    name: 'Marketing & Growth',
    tags: [
      'Marketing', 'Digital Marketing', 'Growth Hacking', 'SEO', 'SEM', 'PPC',
      'Content Marketing', 'Email Marketing', 'Social Media Marketing',
      'Influencer Marketing', 'Affiliate Marketing', 'Brand Strategy', 'PR',
      'Community Building', 'Viral Marketing', 'Performance Marketing',
      'Analytics', 'Conversion Optimization', 'Funnel Building', 'Copywriting',
      'Paid Ads', 'Facebook Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Marketing',
    ],
  },
  {
    name: 'Fitness & Health',
    tags: [
      'Fitness', 'Gym', 'Weightlifting', 'Powerlifting', 'Bodybuilding',
      'CrossFit', 'Calisthenics', 'Running', 'Marathon', 'Cycling', 'Swimming',
      'Yoga', 'Pilates', 'HIIT', 'Cardio', 'Nutrition', 'Meal Prep', 'Keto',
      'Intermittent Fasting', 'Supplements', 'Recovery', 'Sleep Optimization',
      'Biohacking', 'Longevity', 'Sports', 'Basketball', 'Soccer', 'Golf', 'Tennis',
      'Martial Arts', 'Boxing', 'MMA', 'Brazilian Jiu-Jitsu',
    ],
  },
  {
    name: 'Lifestyle & Interests',
    tags: [
      'Travel', 'Digital Nomad', 'Remote Work', 'Work-Life Balance', 'Minimalism',
      'Fashion', 'Style', 'Luxury', 'Cars', 'Watches', 'Sneakers', 'Gaming',
      'Esports', 'Reading', 'Books', 'Podcasts', 'Movies', 'TV Shows', 'Anime',
      'Cooking', 'Food', 'Wine', 'Coffee', 'Outdoors', 'Hiking', 'Camping',
      'Surfing', 'Skiing', 'Snowboarding', 'Dogs', 'Cats', 'Pets', 'Family',
      'Parenting', 'Dating', 'Relationships', 'Networking', 'Events', 'Concerts',
    ],
  },
  {
    name: 'AI & Future Tech',
    tags: [
      'AI', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning',
      'ChatGPT', 'GPT', 'Large Language Models', 'Computer Vision', 'NLP',
      'Generative AI', 'AI Art', 'Stable Diffusion', 'Midjourney', 'DALL-E',
      'Robotics', 'Automation', 'Autonomous Vehicles', 'Web3', 'Metaverse',
      'VR', 'AR', 'Mixed Reality', 'Spatial Computing', 'Quantum Computing',
      'Biotech', 'Neuralink', 'Space Tech', 'Climate Tech', 'Clean Energy',
    ],
  },
  {
    name: 'Content & Influence',
    tags: [
      'Content Creation', 'YouTube', 'TikTok', 'Instagram', 'Twitter', 'LinkedIn',
      'Threads', 'Substack', 'Newsletter', 'Blogging', 'Vlogging', 'Streaming',
      'Twitch', 'Personal Branding', 'Thought Leadership', 'Public Speaking',
      'Keynote Speaker', 'Author', 'Course Creator', 'Community Leader',
      'Influencer', 'Creator Economy', 'Monetization', 'Sponsorships', 'Brand Deals',
    ],
  },
  {
    name: 'Engineering & Hard Skills',
    tags: [
      'Engineering', 'Mechanical Engineering', 'Electrical Engineering',
      'Civil Engineering', 'Chemical Engineering', 'Aerospace', 'Hardware',
      'Electronics', 'IoT', 'Embedded Systems', 'CAD', '3D Printing',
      'Manufacturing', 'Supply Chain', 'Logistics', 'Operations', 'Product Management',
      'Project Management', 'Agile', 'Scrum', 'Data Science', 'Data Analytics',
      'Business Intelligence', 'Excel', 'SQL', 'Tableau', 'Power BI',
    ],
  },
  {
    name: 'Personal Development & Learning',
    tags: [
      'Self Improvement', 'Personal Development', 'Productivity', 'Time Management',
      'Leadership', 'Management', 'Team Building', 'Hiring', 'Sales', 'Negotiation',
      'Communication', 'Public Speaking', 'Networking', 'Career Development',
      'Job Hunting', 'Resume', 'Interview Prep', 'Salary Negotiation', 'Mentorship',
      'Coaching', 'Life Coaching', 'Executive Coaching', 'Online Courses',
      'Certifications', 'Continuous Learning', 'Reading', 'Speed Reading',
    ],
  },
  {
    name: 'Ambition Ecosystem',
    tags: [
      'Ambitious', 'Dreamer', 'Achiever', 'Winner', 'Goal Crusher', 'Hustler',
      'Visionary', 'Innovator', 'Disruptor', 'Change Maker', 'Impact Driven',
      'Purpose Driven', 'Mission Focused', 'Legacy Builder', 'Empire Builder',
      'Community Member', 'Supporter', 'Collaborator', 'Connector', 'Mentor',
      'Mentee', 'Early Adopter', 'Beta Tester', 'Feedback Giver', 'Ambassador',
    ],
  },
]

// Flat list of all tags
export const ALL_PROFILE_TAGS: string[] = PROFILE_TAG_CATEGORIES.flatMap(
  (category) => category.tags
)

// Get tags by category name
export function getTagsByCategory(categoryName: string): string[] {
  const category = PROFILE_TAG_CATEGORIES.find((c) => c.name === categoryName)
  return category?.tags || []
}

// Search tags
export function searchTags(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  return ALL_PROFILE_TAGS.filter((tag) =>
    tag.toLowerCase().includes(lowerQuery)
  )
}

// Get category for a tag
export function getCategoryForTag(tag: string): string | null {
  for (const category of PROFILE_TAG_CATEGORIES) {
    if (category.tags.includes(tag)) {
      return category.name
    }
  }
  return null
}

