import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { badRequest, ok, internalError, notFound } from "../lib/response"
import { GetCommand } from "@aws-sdk/lib-dynamodb"
import { dynamo } from "../lib/dynamodb"
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

export async function handler(event: APIGatewayProxyEvent) : Promise <APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.id;

        if (!productId) {
            return badRequest("El producto no fue encontrado");
        }

        const result = await dynamo.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }));

        if (!result.Item) {
            return notFound("Producto no encontrado");
        }

        return ok({ product: result.Item });
    } catch (error) {
        console.error("Error en getProduct", error);
        return internalError();
    }
}

export const getProduct = withCors(handler);