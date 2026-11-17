
import { getDatabase } from "@netlify/database";
import { createHmac, timingSafeEqual } from "node:crypto";

function verifyToken(token) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || !token) return null;

    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = createHmac("sha256", secret)
      .update(payload).digest("hex");

    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");

    if (a.length !== b.length || !timingSafeEqual(a, b))
      return null;

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (data.expires < Date.now()) return null;

    return data.username;
  } catch {
    return null;
  }
}

export default async (req) => {
  const username = verifyToken(
    req.headers.get("authorization")?.replace("Bearer ", "")
  );

  if (!username) {
    return Response.json({ error: "Please log in again." }, {
      status: 401
    });
  }

  try {
    const db = getDatabase();

    if (req.method === "GET") {
      const items = await db.sql`
        SELECT id, username, content, created_at
        FROM shared_items
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return Response.json({ items });
    }

    if (req.method === "POST") {
      const { content } = await req.json();

      if (typeof content !== "string" ||
          content.length < 1 || content.length > 2000) {
        return Response.json({ error: "Invalid content." }, {
          status: 400
        });
      }

      const item = await db.sql`
        INSERT INTO shared_items (username, content)
        VALUES (${username}, ${content})
        RETURNING id, username, content, created_at
      `;

      return Response.json({ item: item[0] });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch {
    return Response.json({ error: "Database error." }, {
      status: 500
    });
  }
};
