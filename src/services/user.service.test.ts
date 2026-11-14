import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { InterestGroup, UserRepository } from "../repositories/user.repository.js";
import { UserService } from "./user.service.js";

const makeService = (repo: Partial<UserRepository>) =>
  new UserService(repo as unknown as UserRepository);

describe("UserService", () => {
  it("listUserNames returns the id and name list from the repository", async () => {
    const users = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];
    const service = makeService({ findAllNames: () => Promise.resolve(users) });

    assert.deepEqual(await service.listUserNames(), users);
  });

  it("getProfile throws 404 when the user does not exist", async () => {
    const service = makeService({ findById: () => Promise.resolve(null) });

    const err = await service.getProfile("missing-id").then(
      () => assert.fail("expected getProfile to reject"),
      (e: unknown) => e,
    );
    assert.ok(err instanceof HttpError);
    assert.equal(err.statusCode, StatusCodes.NOT_FOUND);
    assert.equal(err.message, "User not found");
  });

  it("groupUsersByMyInterests returns every interest sorted, with empty groups for no matches", async () => {
    const reading: InterestGroup = { interest: "reading", count: 1, users: [] };
    const repo = {
      findById: () => Promise.resolve({ interests: ["travel", "reading"] }),
      findUsersGroupedByInterests: () => Promise.resolve([reading]),
    } as unknown as Partial<UserRepository>;
    const service = makeService(repo);

    assert.deepEqual(await service.groupUsersByMyInterests("me"), [
      reading,
      { interest: "travel", count: 0, users: [] },
    ]);
  });
});
