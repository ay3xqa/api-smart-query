import { uploadFileToS3 } from "./s3-operations";
import { PrismaClient } from "./generated/client";

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
  },

  Mutation: {
    uploadOpenApi: async (_parent: any, { fileName, fileBase64 }: any) => {
      const buffer = Buffer.from(fileBase64, "base64");
      const s3Key = `uploads/${fileName}`;
      const s3Url = await uploadFileToS3(buffer, s3Key, "application/json");
      const spec = JSON.parse(buffer.toString("utf8"));
      const endpointsData = extractEndpointsFromOpenApi(spec);
      const created = await prisma.api.create({
        data: {
          name: spec.info?.title || "Unnamed API",
          description: spec.info?.description || null,
          type: "REST",
          s3Url,
          endpoints: {
            create: endpointsData.map((e) => ({
              path: e.path,
              method: e.method,
              description: e.description,
              fields: {
                create: e.fields.map((f: any) => ({
                  name: f.name,
                  type: f.type,
                  required: f.required,
                  description: f.description,
                  example: f.example,
                })),
              },
            })),
          },
        },
        include: {
          endpoints: {
            include: { fields: true },
          },
        },
      });

      return created;
    },
  },
};