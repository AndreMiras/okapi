import { createServer } from "node:http";

const hostname = "127.0.0.1";
const port = 4100;
const expectedLogin = {
  Username: "synthetic-user",
  PasswordHash: "synthetic-password",
  Locale: "en",
};

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function matchesExpectedLogin(body) {
  return (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Object.keys(body).sort().join(",") ===
      Object.keys(expectedLogin).sort().join(",") &&
    Object.entries(expectedLogin).every(([key, value]) => body[key] === value)
  );
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${hostname}:${port}`);

  if (url.pathname === "/health") {
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Health check requires GET" });
      return;
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname !== "/api/MyKids/Login/") {
    sendJson(response, 404, { error: "Unexpected fixture path" });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Login requires POST" });
    return;
  }

  try {
    let rawBody = "";
    for await (const chunk of request) {
      rawBody += chunk;
      if (rawBody.length > 10_000) {
        sendJson(response, 413, { error: "Fixture request body is too large" });
        return;
      }
    }

    const body = JSON.parse(rawBody);
    if (!matchesExpectedLogin(body)) {
      sendJson(response, 422, { error: "Unexpected login request body" });
      return;
    }

    sendJson(response, 200, {
      authToken: "synthetic-browser-token",
      dashboard: [
        {
          studentId: "student-one",
          name: "Student One",
          courseList: [
            {
              courseName: "Synthetic Course One",
              groupId: "group-one",
              groupName: "Group One",
            },
          ],
        },
        {
          studentId: "student-two",
          name: "Student Two",
          courseList: [
            {
              courseName: "Synthetic Course Two",
              groupId: "group-two",
              groupName: "Group Two",
            },
          ],
        },
      ],
    });
  } catch {
    sendJson(response, 400, { error: "Malformed fixture request" });
  }
});

server.listen(port, hostname);

function shutdown() {
  server.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
