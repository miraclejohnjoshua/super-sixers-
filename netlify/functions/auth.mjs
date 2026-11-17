
import { createHmac, timingSafeEqual } from "node:crypto";

const members = [
  "Miracle", "Melvin", "Chris",
  "Curtis", "Rayan", "Harsith"
];

function sign(value, secret) {
  return createHmac("sha256", secret)
    .update(value)
    .digest("hex");
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { username, inviteCode } = await req.json();
    const expected = process.env.SIXERS_INVITE_CODE;
    const secret = process.env.SESSION_SECRET;

    if (!expected || !secret) {
      return Response.json(
        { error: "Server setup is incomplete." },
        { status: 500 }
      );
    }

    if (!members.includes(username) || inviteCode !== expected) {
      return Response.json(
        { error: "Invalid username or invite code." },
        { status: 401 }
      );
    }

    const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = Buffer.from(
      JSON.stringify({ username, expires })
    ).toString("base64url");

    const token = payload + "." + sign(payload, secret);

    return Response.json({ token });
  } catch {
    return Response.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
};
