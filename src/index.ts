import {
  CreateTableCommand,
  CreateTableCommandOutput,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  BatchGetCommandOutput,
  BatchWriteCommand,
  BatchWriteCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
  PutCommand,
  PutCommandOutput,
  ScanCommand,
  ScanCommandOutput,
  UpdateCommand,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";

type DynmSuccess<T> = {ok: true; value: T};
type DynmError = {ok: false; value: Error};
type DynmResult<T, B = {}> = Promise<DynmSuccess<T & B> | DynmError>;
type Add<T> = {id: string} & T;

type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

async function tryWrapper(fn: any) {
  try {
    return {ok: true, value: await fn()};
  } catch (error) {
    return {ok: false, value: error};
  }
}

type Props = {
  dev?: boolean;
  credentials?: Credentials;
  primaryKey?: string;
};

export class Dynm {
  private client: DynamoDBClient;
  private doc: DynamoDBDocumentClient;
  private baseTable: string;
  private primaryKey: string;

  constructor(t: string, props: Props = {}) {
    const {dev = false, credentials, primaryKey = "id"} = props;
    this.client = new DynamoDBClient({
      credentials,
      ...(dev ? {endpoint: "http://localhost:8000"} : {}),
    });
    this.doc = DynamoDBDocumentClient.from(this.client);
    this.baseTable = t;
    this.primaryKey = primaryKey;
  }

  changeTable(to: string) {
    this.baseTable = to;
    return this;
  }

  async createBaseTable(name: string): DynmResult<CreateTableCommandOutput> {
    return tryWrapper(() =>
      this.doc.send(
        new CreateTableCommand({
          TableName: name,
          AttributeDefinitions: [
            {
              AttributeName: this.primaryKey,
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: this.primaryKey,
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      )
    );
  }

  async get<T>(id: string): DynmResult<GetCommandOutput, T> {
    return tryWrapper(() =>
      this.doc.send(
        new GetCommand({
          TableName: this.baseTable,
          Key: {
            [this.primaryKey]: id,
          },
        })
      )
    );
  }

  async getBatch<T>(ids: string[]): DynmResult<BatchGetCommandOutput, T> {
    return tryWrapper(() =>
      this.doc.send(
        new BatchGetCommand({
          RequestItems: {
            [this.baseTable]: {
              Keys: ids.map((x) => ({
                [this.primaryKey]: x,
              })),
            },
          },
        })
      )
    );
  }

  async add<T>(data: Add<T>, replace = false): DynmResult<PutCommandOutput> {
    return tryWrapper(async () => {
      if (!replace) {
        const r = await this.get(data.id);
        if (r.ok) {
          return new Error("Item already exists.");
        }
      }
      return this.doc.send(
        new PutCommand({
          TableName: this.baseTable,
          Item: data,
        })
      );
    });
  }

  async addBatch<T>(data: Array<Add<T>>): DynmResult<BatchWriteCommandOutput> {
    return tryWrapper(() =>
      this.doc.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.baseTable]: data.map((x) => ({
              PutRequest: {
                Item: x,
              },
            })),
          },
        })
      )
    );
  }

  async delete(id: string): DynmResult<DeleteCommandOutput> {
    return tryWrapper(() =>
      this.doc.send(
        new DeleteCommand({
          TableName: this.baseTable,
          Key: {
            [this.primaryKey]: id,
          },
        })
      )
    );
  }

  async update<T>(id: string, data: T): DynmResult<UpdateCommandOutput> {
    const entries = Object.entries(data);
    return tryWrapper(() =>
      this.doc.send(
        new UpdateCommand({
          Key: {
            [this.primaryKey]: id,
          },
          TableName: this.baseTable,
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

  async all(limit?: number): DynmResult<ScanCommandOutput> {
    return tryWrapper(() =>
      this.doc.send(
        new ScanCommand({
          TableName: this.baseTable,
          Limit: limit,
        })
      )
    );
  }
}
