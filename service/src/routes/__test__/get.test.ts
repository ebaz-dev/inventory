import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";
import { Inventory } from "../../shared/models/inventory";

const apiPrefix = "/api/v1/inventory";

it("fails when an invalid ID is provided", async () => {
  await request(app)
    .get(`${apiPrefix}/invalid-id`)
    .expect(400);
});