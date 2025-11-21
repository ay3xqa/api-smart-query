# Chat Feature Documentation

## Overview

The Comprehend frontend now includes a tabbed interface that allows users to switch between uploading API specifications and chatting with an AI about their APIs.

## Features

### Tab Navigation
- **Upload Tab**: Upload and process OpenAPI JSON specifications
- **Chat Tab**: Browse all available APIs and chat with selected API

### Auto-Navigation
When a user successfully uploads an API specification, they are automatically switched to the Chat tab with the newly uploaded API pre-selected and ready for questions.

### API Selection
The Chat tab displays all available APIs as interactive cards:
- **Grid Layout**: APIs are shown in a responsive grid (1-3 columns based on screen size)
- **Card Information**: Each card displays the API name, description, and type
- **Visual States**:
  - Unselected: Gray border with hover effect (border turns sapphire blue on hover)
  - Selected: Sapphire blue border with light blue background
- **Click to Select**: Click any API card to select it and start chatting

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
- **No APIs Available**: Shows a prompt to upload an API specification first
- **No API Selected**: Chat interface only appears after selecting an API
- **No Messages**: Shows a welcome message encouraging users to start chatting

## GraphQL Integration

### Queries Used

**Get All APIs:**
```graphql
query GetAllApis {
  getAllApis {
    id
    description
    name
    type
  }
}
```

**Ask API Question:**
```graphql
query AskApiQuestion($apiId: Int!, $question: String!) {
  askApiQuestion(apiId: $apiId, question: $question)
}
```

### Flow
1. On Chat tab load, fetch all available APIs from the backend
2. Display APIs as selectable cards
3. User selects an API by clicking its card
4. User types a question and submits
5. Frontend sends the question with the selected API ID to the backend
6. Backend uses vector search to find relevant endpoints
7. Backend sends context to LLM for generating a response
8. Response is displayed in the chat interface
9. User can switch between different APIs, which clears the chat history

## Components

### Main Components
- `src/app/page.tsx` - Main page with tab navigation
- `src/components/chat-interface.tsx` - Chat UI and logic
- `src/components/file-upload.tsx` - File upload component
- `src/components/ui/tabs.tsx` - Tab component
- `src/components/ui/textarea.tsx` - Textarea component

### State Management
- `activeTab`: Controls which tab is currently visible (upload or chat)
- `currentApiId`: Stores the ID of the last uploaded API
- `apis`: Array of all available APIs fetched from the backend
- `selectedApiId`: The currently selected API for chatting
- `messages`: Array of chat messages (user and assistant)
- `isLoading`: Indicates when waiting for AI response
- `loadingApis`: Indicates when fetching the list of APIs

## Color Scheme

The chat interface uses the sapphire blue accent color scheme:
- User messages: Sapphire blue background (#0f52ba)
- AI messages: Muted gray background
- Avatars: Blue for bot, primary blue for user
- Hover states and focus rings: Primary blue

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message

## User Interactions

### Selecting an API
1. Navigate to the Chat tab
2. Browse the grid of available APIs
3. Click on any API card to select it
4. The card border turns sapphire blue and the background becomes light blue
5. Chat interface appears below with the selected API name in the header
6. Start asking questions

### Switching APIs
1. Click on a different API card
2. Chat history is cleared
3. New chat interface loads for the newly selected API

### After Upload
1. Upload a new API in the Upload tab
2. Automatically switches to Chat tab
3. Newly uploaded API is pre-selected
4. Ready to start chatting immediately

## Future Enhancements

Potential improvements:
- Persist chat history per API to database
- Search/filter APIs by name or type
- API card actions (delete, update, view details)
- Export chat transcript
- Code syntax highlighting in responses
- Markdown formatting support
- Suggested questions based on API endpoints
- Recent APIs or favorites
