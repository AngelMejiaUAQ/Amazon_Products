import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { badRequest, ok, unauthorized, internalError, notFound, forbidden, create } from "../lib/response"
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { dynamo } from "../lib/dynamodb"
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const productId = event.pathParameters?.id;

        if (!productId) {
            return notFound("Producto no encontrado");
        }

        const existing = await dynamo.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }));

        if (!existing.Item) {
            return notFound("Producto no encontrado");
        }

        const body = JSON.parse(event.body ?? "{}");
        const { quantity } = body;

        if (typeof quantity !== "number" || quantity <= 0 || !Number.isInteger(quantity) || quantity === undefined) {
            return badRequest("El stock tiene que ser un valor positivo, entero y no puede ser nulo");
        }

        if (existing.Item.stock < quantity) {
            return badRequest("No hay suficiente stock disponible");
        }

        const now = new Date().toISOString();

        await dynamo.send(new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId },
            UpdateExpression: "SET stock = stock - :quantity, updatedAt = :updatedAt",
            ConditionExpression: "stock >= :quantity",
            ExpressionAttributeValues: {
                ":quantity": quantity,
                ":updatedAt": now
            }
        }));

        return ok({ message: "Stock actualizado exitosamente" });
    } catch (error) {
        console.error("Error en updateStock", error);
        return internalError();
    }
}

export const updateStock = withCors(handler);