import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

const CORS_HEADERS = [
    "Content-Type",
    "Authorization",
    "X-Api-Key",
    "X-Amz-Date",
    "X-Amz-Security-Token"
].join(",");

export function withCors(handler: Handler): Handler {
    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);

        const origin = (event.headers?.origin ?? event.headers?.Origin ?? "").trim();
        const allowAnyOrigin = allowedOrigins.includes("*");
        const isAllowed = allowAnyOrigin || allowedOrigins.includes(origin);
        const allowedOrigin = isAllowed ? (allowAnyOrigin ? "*" : origin) : "";

        const corsHeaders = {
            ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            "Access-Control-Allow-Headers": CORS_HEADERS,
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        };

        // Responder inmediatamente a preflight OPTIONS
        if (event.httpMethod === "OPTIONS") {
            if (!isAllowed) {
                return {
                    statusCode: 403,
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ success: false, message: "CORS origin not allowed" })
                };
            }
            return {
                statusCode: 204,
                headers: corsHeaders,
                body: ""
            };
        }

        const result = await handler(event);

        return {
            ...result,
            headers: {
                ...result.headers,
                ...corsHeaders
            }
        };
    }
}