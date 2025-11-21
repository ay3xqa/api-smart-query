# Chat Feature Documentation

## Overview

The Comprehend frontend now includes a tabbed interface that allows users to switch between uploading API specifications and chatting with an AI about their APIs.

## Features

### Tab Navigation
- **Upload Tab**: Upload and process OpenAPI JSON specifications
- **Chat Tab**: Interactive AI chat interface for asking questions about your API

### Auto-Navigation
When a user successfully uploads an API specification, they are automatically switched to the Chat tab with the API loaded and ready for questions.

## Chat Interface

### Design
The chat interface features a modern, clean design with:
- **Message Bubbles**: User messages appear on the right in primary blue, AI responses on the left in muted gray
- **Avatar Icons**: Bot icon for AI messages, User icon for user messages
- **Timestamps**: Each message shows the time it was sent
- **Auto-scroll**: Messages automatically scroll to the newest message
- **Loading States**: Visual feedback while waiting for AI responses

### User Experience
1. Users can type questions in a textarea at the bottom
2. Press Enter to send (Shift+Enter for new line)
3. Send button or Enter key submits the question
4. AI responses appear with proper formatting
5. Conversation history is maintained during the session

### Empty States
- **No API Selected**: Shows a prompt to upload an API first
- **No Messages**: Shows a welcome message encouraging users to start chatting

## GraphQL Integration

### Query Used
```graphql
query AskApiQuestion($apiId: Int!, $question: String!) {
  askApiQuestion(apiId: $apiId, question: $question)
}
```

### Flow
1. User types a question and submits
2. Frontend sends the question with the current API ID to the backend
3. Backend uses vector search to find relevant endpoints
4. Backend sends context to LLM for generating a response
5. Response is displayed in the chat interface

## Components

### Main Components
- `src/app/page.tsx` - Main page with tab navigation
- `src/components/chat-interface.tsx` - Chat UI and logic
- `src/components/file-upload.tsx` - File upload component
- `src/components/ui/tabs.tsx` - Tab component
- `src/components/ui/textarea.tsx` - Textarea component

### State Management
- `activeTab`: Controls which tab is currently visible
- `currentApiId`: Stores the ID of the uploaded API
- `messages`: Array of chat messages (user and assistant)
- `isLoading`: Indicates when waiting for AI response

## Color Scheme

The chat interface uses the sapphire blue accent color scheme:
- User messages: Sapphire blue background (#0f52ba)
- AI messages: Muted gray background
- Avatars: Blue for bot, primary blue for user
- Hover states and focus rings: Primary blue

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message

## Future Enhancements

Potential improvements:
- Persist chat history to database
- Support for multiple API conversations
- Export chat transcript
- Code syntax highlighting in responses
- Markdown formatting support
- Suggested questions based on API
