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

        const callerId = event.requestContext.authorizer?.userId;

        const existing = await dynamo.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId }
        }));

        if (!existing.Item) {
            return notFound("Producto no encontrado");
        }

        if (existing.Item.sellerId !== callerId) {
            return forbidden("No tienes permiso para actualizar este producto");
        }

        const body = JSON.parse(event.body || "{}");
        const { name, description, price, stock } = body;

        if (!name || !description || !price || !stock) {
            return badRequest("Faltan campos requeridos");
        }

        if (typeof price !== "number" || price < 0) {
            return badRequest("El precio debe ser un número mayor a cero");
        }

        if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
            return badRequest("El stock debe ser un número entero y mayor a cero");
        }

        const now = new Date().toISOString();

        const updates: string[] = ["updatedAt = :updatedAt"];
        const expressionAttributeValues: Record<string, unknown> = { ":updatedAt": now };
        const expressionAttributeNames: Record<string, string> = {};

        if (name) {
            updates.push("#name = :name");
            expressionAttributeNames["#name"] = "name";
            expressionAttributeValues[":name"] = name;
        }

        if (description) {
            updates.push("description = :description");
            expressionAttributeValues[":description"] = description;
        }

        if (price !== undefined) {
            updates.push("price = :price");
            expressionAttributeValues[":price"] = price;
        }

        if (stock !== undefined) {
            updates.push("stock = :stock");
            expressionAttributeValues[":stock"] = stock;
        }

        await dynamo.send(new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { productId },
            UpdateExpression: "SET " + updates.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ...(Object.keys(expressionAttributeNames).length > 0 && {
                ExpressionAttributeNames: expressionAttributeNames
            })
        }));

        return ok({ message: "Producto actualizado exitosamente" });
    } catch (error) {
        console.error("Error en updateProduct", error);
        return internalError();
    }
}

export const updateProduct = withCors(handler);