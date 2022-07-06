import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { Client } from "pg";

const wherebyEventsHandler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent
) => {
  try {
    const eventBody = JSON.parse(event.body || "{}");

    const client = new Client({
      connectionString: process.env.DATBASE_URL,
    });

    await client.connect();

    // currently support session started whereby event
    if (eventBody.type !== "room.session.started") {
      return {
        body: "Event type not supported yet",
        statusCode: 400,
      };
    }

    const meetingId = eventBody.data.meetingId;

    const result = await client.query(
      `SELECT "id" FROM "Cohort" where "meetingId"='${meetingId}'`
    );

    const cohortId = result.rows?.[0]?.id;

    // if no cohort is related to the current meeting session
    // session started event object has meetingId

    if (!cohortId) {
      return {
        body: "Room session is not related to any cohort",
        statusCode: 400,
      };
    }

    const roomName = eventBody.data.roomName.replace("/", "");

    await client.query(
      `INSERT INTO "CohortSession" ("cohortId", "roomName", "createdAt") VALUES (${cohortId}, '${roomName}', '${eventBody.createdAt}')`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "cohort session created successfyly",
      }),
    };
  } catch (error) {
    console.log("the error is ", error);
    return {
      statusCode: 400,
      body: error.toString(),
    };
  }
};

exports.handler = wherebyEventsHandler;
