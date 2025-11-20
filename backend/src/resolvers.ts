import { downloadFileFromS3 } from "./s3-operations";
import { PrismaClient } from "./generated/client";
import { OpenAIClient } from "./open-ai";
import { Pool } from "pg";

const prisma = new PrismaClient();

// helper to extract endpoints from OpenAPI
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
  },

  Mutation: {
    uploadOpenApi: async (_parent: any, { fileKey }: { fileKey: string }) => {
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
        const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
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
