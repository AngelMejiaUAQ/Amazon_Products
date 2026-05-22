import { APIGatewayProxyResult } from "aws-lambda";

export const ok = (data: unknown): APIGatewayProxyResult => ({
    statusCode: 200,
    body: JSON.stringify(data)
})

export const create = (data: unknown): APIGatewayProxyResult => ({
    statusCode: 201,
    body: JSON.stringify(data)
})

export const badRequest = (message: string): APIGatewayProxyResult => ({
    statusCode: 400,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ success: false, message })
})

export const unauthorized = (message = "Unauthorized"): APIGatewayProxyResult => ({
    statusCode: 401,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ success: false, message })
})

export const internalError = (message = "Internal Server Error"): APIGatewayProxyResult => ({
    statusCode: 500,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ success: false, message })
})

export const notFound = (message = "Not Found"): APIGatewayProxyResult => ({
    statusCode: 404,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ success: false, message })
})

export const forbidden = (message = "Forbidden"): APIGatewayProxyResult => ({
    statusCode: 403,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ success: false, message })
})