import { NextRequest, NextResponse } from 'next/server'
import { 
  getQueueItems, 
  deleteQueueItem,
  bulkDeleteQueueItems,
  type QueueStatus 
} from '@/lib/queries-npc'

// GET /api/npc/queue - Get queue items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const options = {
      npcId: searchParams.get('npc_id') || undefined,
      status: searchParams.get('status') as QueueStatus | undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      page: parseInt(searchParams.get('page') || '1'),
    }

    const result = await getQueueItems(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}

// DELETE /api/npc/queue - Delete queue items (single or bulk)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, id } = body

    // Support both single id and array of ids
    const idsToDelete: string[] = ids || (id ? [id] : [])

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'Queue item id(s) required' },
        { status: 400 }
      )
    }

    let success: boolean
    if (idsToDelete.length === 1) {
      success = await deleteQueueItem(idsToDelete[0])
    } else {
      success = await bulkDeleteQueueItems(idsToDelete)
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete queue item(s)' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: idsToDelete.length })
  } catch (error) {
    console.error('Error deleting queue items:', error)
    return NextResponse.json(
      { error: 'Failed to delete queue items' },
      { status: 500 }
    )
  }
}

