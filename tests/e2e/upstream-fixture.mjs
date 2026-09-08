import { createServer } from "node:http";

const hostname = "127.0.0.1";
const port = 4100;
const expectedLoginKeys = ["Locale", "PasswordHash", "Username"];
let registered = false;

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function loginScenario(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).sort().join(",") !== expectedLoginKeys.join(",") ||
    body.Locale !== "en" ||
    body.PasswordHash !== "synthetic-password"
  ) {
    return null;
  }

  if (body.Username === "synthetic-user") return "normal";
  if (body.Username === "synthetic-notice") return "notice";
  return null;
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

  if (url.pathname === "/reset") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Reset requires POST" });
      return;
    }
    registered = false;
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/MyKids/RegisterAbsence") {
    if (
      request.method !== "POST" ||
      request.headers.authtoken !== "synthetic-browser-token"
    ) {
      sendJson(response, 401, { error: "Invalid registration request" });
      return;
    }

    try {
      let rawBody = "";
      for await (const chunk of request) rawBody += chunk;
      const body = JSON.parse(rawBody);
      const validBody =
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        Object.keys(body).sort().join(",") === "FollowUpId,Reason,StudentId" &&
        body.FollowUpId === "follow-up-one" &&
        body.Reason === "Synthetic illness" &&
        body.StudentId === "student-one";
      if (!validBody || registered) {
        sendJson(response, 422, { error: "Unexpected registration body" });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
      registered = true;
      response.writeHead(204);
      response.end();
    } catch {
      sendJson(response, 400, { error: "Malformed registration request" });
    }
    return;
  }

  const attendanceMatch = url.pathname.match(
    /^\/api\/MyKids\/GetMyKidsAbsences\/([^/]+)\/([^/]+)$/,
  );
  if (attendanceMatch) {
    if (
      request.method !== "GET" ||
      request.headers.authtoken !== "synthetic-browser-token"
    ) {
      sendJson(response, 401, { error: "Invalid attendance request" });
      return;
    }

    const [, studentId, groupId] = attendanceMatch;
    if (studentId === "student-one" && groupId === "group-one") {
      sendJson(response, 200, {
        Absences: [
          {
            Date: "2026-09-08",
            Title: "Synthetic recorded absence",
            Reason: "Synthetic illness",
          },
          ...(registered
            ? [
                {
                  Date: "2026-09-10 at 17:30",
                  Title: "Registered synthetic absence",
                  Reason: "Synthetic illness",
                },
              ]
            : []),
        ],
        Dates: {
          Dates: registered
            ? []
            : [
                {
                  Date: "2026-09-10 at 17:30",
                  FollowUpId: "follow-up-one",
                },
              ],
          Concepts: ["Synthetic illness", "Synthetic appointment"],
        },
      });
      return;
    }
    if (studentId === "student-two" && groupId === "group-two") {
      sendJson(response, 200, {
        Absences: [],
        Dates: { Dates: [], Concepts: [] },
      });
      return;
    }

    sendJson(response, 404, { error: "Unknown attendance selection" });
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
    const scenario = loginScenario(body);
    if (!scenario) {
      sendJson(response, 422, { error: "Unexpected login request body" });
      return;
    }

    sendJson(response, 200, {
      authToken: "synthetic-browser-token",
      ForceLogout: false,
      TermsPending: scenario === "notice",
      SchoolUser: false,
      ERR_CODE:
        scenario === "notice"
          ? "Synthetic notice: <b>review this message</b>."
          : "",
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
