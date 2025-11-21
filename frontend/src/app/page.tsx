'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { ChatInterface } from '@/components/chat-interface'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sparkles, Upload, MessageSquare } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload')
  const [currentApiId, setCurrentApiId] = useState<number | null>(null)

  const handleUploadSuccess = (apiData: any) => {
    console.log('API uploaded successfully:', apiData)
    setCurrentApiId(apiData.id)
    setActiveTab('chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center space-y-12">
          <div className="text-center space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered API Intelligence
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Comprehend
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Upload your OpenAPI specifications and let AI help you understand,
              explore, and interact with your APIs effortlessly.
            </p>
          </div>

          <Tabs className="w-full">
            <TabsList className="w-full max-w-md mx-auto">
              <TabsTrigger
                active={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger
                active={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent hidden={activeTab !== 'upload'}>
              <div className="flex justify-center">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Simply drag and drop your OpenAPI JSON specification file
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analyze</h3>
                  <p className="text-sm text-muted-foreground">
                    AI automatically processes and understands your API endpoints
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ask</h3>
                  <p className="text-sm text-muted-foreground">
                    Query your API using natural language and get instant answers
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent hidden={activeTab !== 'chat'}>
              <ChatInterface initialApiId={currentApiId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
