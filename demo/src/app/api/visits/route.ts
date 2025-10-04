import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const VISITS_FILE = path.join(process.cwd(), 'data', 'visits.json')
const GIST_ID = process.env.GITHUB_GIST_ID
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

interface VisitData {
  count: number
  lastUpdated: string
}

// Check if we have GitHub configuration for production storage
const hasGitHubConfig = GIST_ID && GITHUB_TOKEN

async function ensureDataDirectory() {
  const dataDir = path.dirname(VISITS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function getVisitCountFromFile(): Promise<VisitData> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(VISITS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { count: 0, lastUpdated: new Date().toISOString() }
  }
}

async function setVisitCountToFile(visitData: VisitData): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(VISITS_FILE, JSON.stringify(visitData, null, 2))
}

async function getVisitCountFromGist(): Promise<VisitData> {
  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch gist')
    }
    
    const gist = await response.json()
    const fileContent = gist.files['visits.json']?.content
    
    if (fileContent) {
      return JSON.parse(fileContent)
    }
    
    return { count: 0, lastUpdated: new Date().toISOString() }
  } catch (error) {
    console.error('GitHub Gist error:', error)
    return { count: 0, lastUpdated: new Date().toISOString() }
  }
}

async function setVisitCountToGist(visitData: VisitData): Promise<void> {
  try {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'visits.json': {
            content: JSON.stringify(visitData, null, 2)
          }
        }
      })
    })
  } catch (error) {
    console.error('Failed to update GitHub Gist:', error)
    throw error
  }
}

async function getVisitCount(): Promise<VisitData> {
  if (hasGitHubConfig) {
    try {
      return await getVisitCountFromGist()
    } catch (error) {
      console.error('Gist error, falling back to file:', error)
      return getVisitCountFromFile()
    }
  } else {
    return getVisitCountFromFile()
  }
}

async function incrementVisitCount(): Promise<VisitData> {
  const current = await getVisitCount()
  const updated: VisitData = {
    count: current.count + 1,
    lastUpdated: new Date().toISOString()
  }
  
  if (hasGitHubConfig) {
    try {
      await setVisitCountToGist(updated)
    } catch (error) {
      console.error('Gist error, falling back to file:', error)
      await setVisitCountToFile(updated)
    }
  } else {
    await setVisitCountToFile(updated)
  }
  
  return updated
}

export async function GET() {
  try {
    const visitData = await getVisitCount()
    return NextResponse.json(visitData)
  } catch (error) {
    console.error('Error getting visit count:', error)
    return NextResponse.json(
      { error: 'Failed to get visit count' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const visitData = await incrementVisitCount()
    return NextResponse.json(visitData)
  } catch (error) {
    console.error('Error incrementing visit count:', error)
    return NextResponse.json(
      { error: 'Failed to increment visit count' },
      { status: 500 }
    )
  }
}