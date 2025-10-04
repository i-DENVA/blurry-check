import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const VISITS_FILE = path.join(process.cwd(), 'data', 'visits.json')

interface VisitData {
  count: number
  lastUpdated: string
}

async function ensureDataDirectory() {
  const dataDir = path.dirname(VISITS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function getVisitCount(): Promise<VisitData> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(VISITS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // File doesn't exist or is invalid, return default
    return { count: 0, lastUpdated: new Date().toISOString() }
  }
}

async function incrementVisitCount(): Promise<VisitData> {
  const current = await getVisitCount()
  const updated: VisitData = {
    count: current.count + 1,
    lastUpdated: new Date().toISOString()
  }
  
  await ensureDataDirectory()
  await fs.writeFile(VISITS_FILE, JSON.stringify(updated, null, 2))
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