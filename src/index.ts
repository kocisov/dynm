import {
  CreateTableCommand,
  CreateTableCommandOutput,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

type DynmSuccess<T> = {ok: true; value: T};
type DynmError = {ok: false; value: Error};
type DynmResult<T> = Promise<DynmSuccess<T> | DynmError>;

type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

async function tryWrapper<T>(fn: any): DynmResult<T> {
  try {
    return {ok: true, value: await fn()};
  } catch (error) {
    return {ok: false, value: error};
  }
}

export class Dynm {
  private client: DynamoDBClient;
  private doc: DynamoDBDocumentClient;

  constructor(dev = false, credentials?: Credentials) {
    this.client = new DynamoDBClient({
      credentials,
      ...(dev ? {endpoint: "http://localhost:8000"} : {}),
    });
    this.doc = DynamoDBDocumentClient.from(this.client);
  }

  async createBaseTable(name: string): DynmResult<CreateTableCommandOutput> {
    return tryWrapper(() =>
      this.doc.send(
        new CreateTableCommand({
          TableName: name,
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      )
    );
  }

  async add<T>(table: string, data: T): DynmResult<PutCommandOutput> {
    return tryWrapper(() =>
      this.doc.send(
        new PutCommand({
          TableName: table,
          Item: data,
        })
      )
    );
  }

  async delete(table: string, id: string) {
    return tryWrapper(() =>
      this.doc.send(
        new DeleteCommand({
          TableName: table,
          Key: {
            id,
          },
        })
      )
    );
  }

  async update<T>(table: string, id: string, data: T) {
    const entries = Object.entries(data);
    return tryWrapper(() =>
      this.doc.send(
        new UpdateCommand({
          Key: {id},
          TableName: table,
          UpdateExpression: `SET ${Object.keys(data)
            .map((key) => `#${key} = :${key}`)
            .join(", ")}`,
          ExpressionAttributeNames: entries.reduce(
            (previous, current) => ({
              ...previous,
              [`#${current[0]}`]: current[0],
            }),
            {}
          ),
          ExpressionAttributeValues: entries.reduce(
            (previous, current) => ({
              ...previous,
              [`:${current[0]}`]: current[1],
            }),
            {}
          ),
          ReturnValues: "ALL_NEW",
        })
      )
    );
  }
}
