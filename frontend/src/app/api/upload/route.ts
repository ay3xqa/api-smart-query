import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
    const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
    const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    const timestamp = Date.now()
    const fileKey = `${timestamp}-${file.name}`

    const s3Response = await fetch(
      `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: buffer,
      }
    )

    if (!s3Response.ok) {
      throw new Error('Failed to upload to S3')
    }

    return NextResponse.json({ fileKey })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    )
  }
}
