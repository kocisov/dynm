import {Dynm} from "../dist/dynm.cjs";

const dynm = new Dynm("Tests", {
  dev: true,
  // credentials: {
  //   accessKeyId: "...",
  //   secretAccessKey: "...",
  // },
  // primaryKey: "id",
});

async function main() {
  const addTable = await dynm.createBaseTable("Tests");

  console.log("[CREATE TABLE]:", addTable.ok, "\n");

  const addOne = await dynm.add(
    {
      id: "hello",
      colorful: true,
      message: "Hello",
      canBeBroadcasted: false,
    },
    true
  );

  if (addOne.ok) {
    console.log("[ADD] ID: hello =", addOne.value, "\n");
  }

  const all = await dynm.all();

  if (all.ok) {
    const {Count, Items} = all.value;
    console.log("[ALL] Count:", Count, "Items =", Items, "\n");
  }

  const getOne = await dynm.get("hello");

  if (getOne.ok) {
    console.log("[GET] ID: hello =", getOne.value.Item, "\n");
  }

  const up = await dynm.update("hello", {
    afterUpdate: true,
  });

  if (up.ok) {
    console.log("[UPDATE] ID: hello =", up.value, "\n");
  }

  const deleteOne = await dynm.delete("hello");

  if (deleteOne.ok) {
    console.log("[DELETE] ID: hello", "\n");
  }

  const allAfterDelete = await dynm.all();

  if (allAfterDelete.ok) {
    const {Count, Items} = allAfterDelete.value;
    console.log("[ALL] Count:", Count, "Items =", Items, "\n");
  }
}

main();
