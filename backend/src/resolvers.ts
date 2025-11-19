import { uploadFileToS3 } from "./s3-operations";
import { PrismaClient } from "./generated/client";
import { OpenAIClient } from "./open-ai";
import { Pool } from "pg";


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
  console.log("Extracted endpoints:", endpoints);
  return endpoints;
}

type FieldInput = {
  name: string;
  type: string;
  required: boolean;
  description: string | null;
  example: string | null;
};

// --- Resolvers ---
export const resolvers = {
  Query: {
    hello: () => "Hello from GraphQL!",
  },

  Mutation: {
    uploadOpenApi: async (_parent: any, { fileName, fileBase64 }: any) => {
      const buffer = Buffer.from(fileBase64, "base64");
      const s3Key = `uploads/${fileName}`;
      const s3Url = await uploadFileToS3(buffer, s3Key, "application/json");

      const spec = JSON.parse(buffer.toString("utf8"));
      const endpointsData = extractEndpointsFromOpenApi(spec);

      const api = await prisma.api.create({
        data: {
          name: spec.info?.title || "Unnamed API",
          description: spec.info?.description || null,
          type: "REST",
          s3Url,
        },
      });

// create endpoints + fields and collect created ids
      const createdEndpoints: { id: number; meta: any }[] = [];
      for (const e of endpointsData) {
        const created = await prisma.endpoint.create({
          data: {
            path: e.path,
            method: e.method,
            description: e.description,
            apiId: api.id,
            fields: {
              create: e.fields.map((f: FieldInput) => ({
                name: f.name,
                type: f.type,
                required: f.required,
                description: f.description,
                example: f.example,
              })),
            },
          },
        });
        createdEndpoints.push({ id: created.id, meta: e });
      }

      // Build embedding inputs (one input per endpoint)
      const embeddingInputs = createdEndpoints.map((ce) => {
        const e = ce.meta;
        const fieldsText = (e.fields || [])
          .map((f: any) => `${f.name}:${f.type}:${String(f.example ?? "")}`)
          .join(" ");
        return `${e.method} ${e.path} ${e.description ?? ""} ${fieldsText}`;
      });

      if (embeddingInputs.length > 0 && process.env.OPENAI_API_KEY) {
        const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
        const resp = await OpenAIClient.embeddings.create({
          model,
          input: embeddingInputs,
        });

        // resp.data is array of embeddings in same order as inputs
        for (let i = 0; i < resp.data.length; i++) {
          const vector = resp.data[i].embedding.map((x: any) => Number(x));
          const vectorString = `[${vector.join(",")}]`;
          const endpointId = createdEndpoints[i].id;
          const pool = new Pool({ connectionString: process.env.SUPABASE_DIRECT });

          await pool.query(
            'UPDATE "Endpoint" SET "embedding" = $1::vector WHERE id = $2',
            [vectorString, endpointId]
          );
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
