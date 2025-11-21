export async function getUploadUrl(fileName: string) {
  const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'

  const query = `
    query GetUploadUrl($fileName: String!) {
      getUploadUrl(fileName: $fileName) {
        uploadUrl
        fileKey
      }
    }
  `

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        fileName,
      },
    }),
  })

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data.getUploadUrl
}

export async function uploadOpenApiSpec(fileKey: string) {
  const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'

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

  return result.data.uploadOpenApi
}

export async function askApiQuestion(apiId: number, question: string) {
  const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'

  const query = `
    query AskApiQuestion($apiId: Int!, $question: String!) {
      askApiQuestion(apiId: $apiId, question: $question)
    }
  `

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        apiId,
        question,
      },
    }),
  })

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data.askApiQuestion
}
