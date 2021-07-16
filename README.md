# dynm

> Utility for easier interaction with DynamoDB

## Installation

Inside your project directory, run the following:

```bash
yarn add dynm
```

Or with npm:

```bash
npm install dynm
```

## Usage

> Example can be found at [/test](https://github.com/kocisov/dynm/blob/main/test/index.ts)

- Default primaryKey is set to `id`

```ts
import {Dynm} from "dynm";

const dynm = new Dynm("table");

const result = await dynm.get("key");

if (result.ok) {
  console.log(result.value.Item);
} else {
  console.log(result.value.message);
}
```

## API

- `createBaseTable(name: string)` - Creates base table with specified name and with primaryKey
- `get(id: string)` - Gets one item from table by id
- `add<T>(data: T, replace?: boolean)` - Inserts and/or replaces new item to table
- `update<T>(id: string, data: T)` - Updates one item from table by id and returns full item with new values
- `delete(id: string)` - Deletes one item from table by id
- `all()` - Gets all items from table

## License

The MIT License.
