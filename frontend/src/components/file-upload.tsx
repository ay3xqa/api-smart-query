'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileJson, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onUploadSuccess?: (apiData: any) => void
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/json' || droppedFile.name.endsWith('.json')) {
        setFile(droppedFile)
        setError(null)
        setSuccess(false)
      } else {
        setError('Please upload a valid JSON file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile)
        setError(null)
        setSuccess(false)
      } else {
        setError('Please upload a valid JSON file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const fileContent = await file.text()
      JSON.parse(fileContent)

      const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'

      const presignedUrlQuery = `
        query GetUploadUrl($fileName: String!) {
          getUploadUrl(fileName: $fileName) {
            uploadUrl
            fileKey
          }
        }
      `

      const presignedResponse = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: presignedUrlQuery,
          variables: {
            fileName: file.name,
          },
        }),
      })

      const presignedResult = await presignedResponse.json()

      if (presignedResult.errors) {
        throw new Error(presignedResult.errors[0].message)
      }

      const { uploadUrl, fileKey } = presignedResult.data.getUploadUrl

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3')
      }

      const mutation = `
        mutation UploadOpenApi($fileKey: String!) {
          uploadOpenApi(fileKey: $fileKey) {
            id
            name
            description
            type
            endpoints {
              path
              method
              description
            }
          }
        }
      `

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            fileKey,
          },
        }),
      })

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      setSuccess(true)
      if (onUploadSuccess) {
        onUploadSuccess(result.data.uploadOpenApi)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Upload API Specification</CardTitle>
        <CardDescription>
          Upload your OpenAPI JSON specification to analyze endpoints with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 transition-all ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            {file ? (
              <>
                <FileJson className="w-12 h-12 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Drop your JSON file here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Select File
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20 text-primary">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">API specification uploaded successfully!</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload & Analyze'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
