import { downloadFileFromS3, create_presigned_upload_url } from "./s3-operations";
import { PrismaClient } from "./generated/client";
import { OpenAIClient } from "./open-ai";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

function extractEndpointsFromOpenApi(spec: any) {
  const endpoints: any[] = [];
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, opRaw] of Object.entries(methods as any)) {
      const op = opRaw as any;
      const description = op.description || op.summary || null;

      const fields: any[] = [];
      const params = op?.parameters || [];
      for (const p of params) {
        fields.push({
          name: p.name,
          type: p.schema?.type || "string",
          required: !!p.required,
          description: p.description || null,
          example: p.example ?? null,
        });
      }

      endpoints.push({
        path,
        method: method.toUpperCase(),
        description,
        fields,
      });
    }
  }

  return endpoints;
}

// --- Resolvers ---
export const resolvers = {
  Query: {
    hello: () => "Hello from GraphQL!",

    askApiQuestion: async (_parent: any, { apiId, question }: { apiId: number; question: string }) => {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not set");
      }
      if (!process.env.SUPABASE_DIRECT) {
        throw new Error("Supabase direct connection string not set");
      }
      if (!process.env.OPENAI_EMBEDDING_MODEL) {
        throw new Error("OpenAI embedding model not set");
      }
      if (!process.env.OPENAI_CHAT_MODEL) {
        throw new Error("OpenAI chat model not set");
      }
      const pool = new Pool({ connectionString: process.env.SUPABASE_DIRECT });

      const question_embedding = await OpenAIClient.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL,
        input: question
      })
      const question_vector = question_embedding.data[0].embedding.map(Number);
      const vector_string = `[${question_vector.join(",")}]`;

      //Context Building - to always be finetuning
      const query = `
        SELECT e.id, e.path, e.method, e.description,
              json_agg(json_build_object(
                'name', f.name,
                'type', f.type,
                'description', f.description,
                'example', f.example
              )) AS fields
        FROM "Endpoint" e
        LEFT JOIN "EndpointField" f ON f."endpointId" = e.id
        WHERE e."apiId" = $1
        GROUP BY e.id
        ORDER BY e."embedding" <#> $2::vector
        LIMIT 5;
      `;

      const { rows } = await pool.query(query, [apiId, vector_string]);

      // Build context including fields
      const contextText = rows
        .map((r: any) => {
          const fieldsText = (r.fields || [])
            .map((f: any) => `${f.name}:${f.type}:${f.example ?? ""}`)
            .join(" ");
          return `${r.method} ${r.path} ${r.description ?? ""} ${fieldsText}`;
        })
        .join("\n\n");

      const gptResp = await OpenAIClient.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert assistant for APIs. Use the context below to answer the question.",
          },
          {
            role: "user",
            content: `Context:\n${contextText}\n\nQuestion: ${question}`,
          },
        ],
        max_completion_tokens: 3000,
      });
      console.log(`Context:\n${contextText}\n\nQuestion: ${question}`)
      const answer = gptResp.choices[0].message?.content ?? "No answer available";

      return answer;
    },

    getUploadUrl: async (_: any, { fileName }: { fileName: string }) => {

      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
        throw new Error("AWS environment variables not configured");
      }

      return create_presigned_upload_url(fileName)
    },
  },

  Mutation: {
    uploadOpenApi: async (_parent: any, { fileKey }: { fileKey: string }) => {
      if (!process.env.AWS_S3_BUCKET_NAME) {
        throw new Error("AWS S3 bucket name not set");
      }
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not set");
      }
      if (!process.env.SUPABASE_DIRECT) {
        throw new Error("Supabase direct connection string not set");
      }
      if (!process.env.OPENAI_EMBEDDING_MODEL) {
        throw new Error("OpenAI embedding model not set");
      }
      const buffer = await downloadFileFromS3(fileKey);
      const spec = JSON.parse(buffer.toString("utf8"));
      const endpointsData = extractEndpointsFromOpenApi(spec);

      const api = await prisma.api.create({
        data: {
          name: spec.info?.title || "Unnamed API",
          description: spec.info?.description || null,
          type: "REST",
          s3Url: `s3://${process.env.AWS_S3_BUCKET_NAME}/${fileKey}`,
        },
      });

      const endpointRows = endpointsData.map((e) => ({
        path: e.path,
        method: e.method,
        description: e.description,
        apiId: api.id,
      }));

      const createdEndpoints = await prisma.endpoint.createMany({
        data: endpointRows,
        skipDuplicates: true,
      });

      const endpointRecords = await prisma.endpoint.findMany({
        where: { apiId: api.id },
      });

      const fieldRows = endpointsData.flatMap((e, idx) =>
        e.fields.map((f : any) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          description: f.description,
          example: f.example,
          endpointId: endpointRecords[idx].id,
        }))
      );

      if (fieldRows.length > 0) {
        await prisma.endpointField.createMany({ data: fieldRows, skipDuplicates: true });
      }

      if (process.env.OPENAI_API_KEY) {
        const model = process.env.OPENAI_EMBEDDING_MODEL;
        const pool = new Pool({ connectionString: process.env.SUPABASE_DIRECT });

        const chunkSize = 10;
        for (let i = 0; i < endpointRecords.length; i += chunkSize) {
          const chunkEndpoints = endpointRecords.slice(i, i + chunkSize);
          const chunkInput = chunkEndpoints.map((ep, idx) => {
            const fieldsText = endpointsData[i + idx].fields
              .map((f: any) => `${f.name}:${f.type}:${String(f.example ?? "")}`)
              .join(" ");
            return `${ep.method} ${ep.path} ${ep.description ?? ""} ${fieldsText}`;
          });

          const resp = await OpenAIClient.embeddings.create({
            model,
            input: chunkInput,
          });

          for (let j = 0; j < resp.data.length; j++) {
            const vector = resp.data[j].embedding.map(Number);
            const vectorString = `[${vector.join(",")}]`;
            const endpointId = chunkEndpoints[j].id;

            await pool.query(
              'UPDATE "Endpoint" SET "embedding" = $1::vector WHERE id = $2',
              [vectorString, endpointId]
            );
          }
        }
      }

      const apiWithEndpoints = await prisma.api.findUnique({
        where: { id: api.id },
        include: { endpoints: { include: { fields: true } } },
      });

      return apiWithEndpoints;
    },
  },
};
