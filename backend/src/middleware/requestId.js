import { randomUUID } from "node:crypto";

export function requestId(req, res, next) {
  const requestedId = req.get("x-request-id");
  const id =
    requestedId && /^[A-Za-z0-9._:-]{1,128}$/.test(requestedId)
      ? requestedId
      : randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
