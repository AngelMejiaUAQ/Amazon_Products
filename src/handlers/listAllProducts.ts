import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { badRequest, ok, internalError, notFound } from "../lib/response"
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { dynamo } from "../lib/dynamodb"
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

async function handler(event: APIGatewayProxyEvent) : Promise <APIGatewayProxyResult> {
    try {
        const result = await dynamo.send(new ScanCommand({
            TableName: PRODUCTS_TABLE// Esto es solo para obtener la tabla, no se usará el resultado
        }));

        return ok({ product: result.Items ?? [] });
    } catch (error) {
        console.error("Error en listAllProducts", error);
        return internalError();
    }
}

export const listAllProducts = withCors(handler);