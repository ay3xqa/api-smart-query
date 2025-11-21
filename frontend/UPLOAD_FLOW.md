# Upload Flow

This document describes the secure file upload flow using presigned URLs.

## Flow Diagram

```
User → Frontend → Backend GraphQL → AWS S3 → Backend Processing
```

## Step-by-Step Process

### 1. User Selects File
- User drags and drops or selects an OpenAPI JSON file
- Frontend validates the file is valid JSON

### 2. Request Presigned URL
The frontend queries the backend GraphQL API:

```graphql
query GetUploadUrl($fileName: String!) {
  getUploadUrl(fileName: $fileName) {
    uploadUrl
    fileKey
  }
}
```

**Response:**
```json
{
  "data": {
    "getUploadUrl": {
      "uploadUrl": "https://your-bucket.s3.amazonaws.com/file.json?X-Amz-...",
      "fileKey": "1234567890-api-spec.json"
    }
  }
}
```

### 3. Upload to S3
The frontend uploads the file directly to S3 using the presigned URL:

```javascript
await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: file,
})
```

### 4. Process the File
Once uploaded to S3, the frontend calls the backend mutation:

```graphql
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
```

### 5. Backend Processing
The backend:
1. Downloads the file from S3 using the `fileKey`
2. Parses the OpenAPI JSON specification
3. Extracts all endpoints and their fields
4. Generates embeddings for each endpoint using OpenAI
5. Stores everything in the database
6. Returns the processed API data

## Security Benefits

1. **No AWS Credentials in Frontend**: The frontend never has access to AWS credentials
2. **Time-Limited URLs**: Presigned URLs expire after a set time period
3. **Scoped Permissions**: URLs only allow uploading to specific S3 paths
4. **Backend Validation**: Backend controls what files can be uploaded and where

## Implementation Files

- **Frontend Component**: `src/components/file-upload.tsx`
- **GraphQL Client**: `src/lib/graphql-client.ts`
- **Backend Schema**: Backend must implement the `getUploadUrl` query
- **Backend Resolver**: Backend generates presigned URLs using AWS SDK

## Error Handling

The flow handles errors at each step:
- JSON validation before upload
- Presigned URL generation failures
- S3 upload failures
- Backend processing errors

All errors are displayed to the user with clear messaging.
