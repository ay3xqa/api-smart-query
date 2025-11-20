import { gql } from "apollo-server";

export const typeDefs = gql`
type Field {
  name: String!
  type: String
  required: Boolean
  description: String
  example: String
}

type Endpoint {
  path: String!
  method: String!
  description: String
  fields: [Field!]!
}

type Api {
  id: ID!
  name: String!
  description: String
  type: String!
  endpoints: [Endpoint!]!
  s3Url: String
}

type Mutation {
  uploadOpenApi(fileKey: String!): Api!
}

type Query {
  hello: String!
}

`;