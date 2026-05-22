import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import {ok, internalError, notFound, forbidden, create } from "../lib/response"
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { dynamo } from "../lib/dynamodb"
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.id;

        if (!productId) {
            return notFound("Producto no encontrado");
        }

        const callerId = event.requestContext.authorizer?.userId;

        const existing = await dynamo.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }));

        if (!existing.Item) {
            return notFound("Producto no encontrado");
        }

        if (existing.Item.sellerId !== callerId) {
            return forbidden("No tienes permiso para eliminar este producto");
        }

        await dynamo.send(new DeleteCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }));

        return ok({ message: "Producto eliminado exitosamente" });
    } catch (error) {
        console.error("Error en deleteProduct", error);
        return internalError();
    }
}

export const deleteProduct = withCors(handler);