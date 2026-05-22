import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { badRequest, ok, internalError, notFound } from "../lib/response"
import { GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { dynamo } from "../lib/dynamodb"
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

export async function handler(event: APIGatewayProxyEvent) : Promise <APIGatewayProxyResult> {
    try {
        const sellerId = event.pathParameters?.sellerId;

        if (!sellerId) {
            return ok({ product: [] }); // Si no se proporciona sellerId, devolvemos un array vacío
        }

        const result = await dynamo.send(new QueryCommand({
            TableName: PRODUCTS_TABLE,
            IndexName: "SellerIndex",
            KeyConditionExpression: "sellerId = :sellerId",
            ExpressionAttributeValues: {
                ":sellerId": sellerId
            }
        }));

        return ok({ product: result.Items ?? [] });
    } catch (error) {
        console.error("Error en listProductsBySeller", error);
        return internalError();
    }
}

export const listProductsBySeller = withCors(handler);