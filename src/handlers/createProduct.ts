import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { badRequest, ok, unauthorized, internalError, notFound, forbidden, create } from "../lib/response"
import { GetCommand, PutCommand , QueryCommand } from "@aws-sdk/lib-dynamodb"
import { dynamo } from "../lib/dynamodb"
import { Product } from "../types/product";
import { v4 as uuidv4 } from "uuid"
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

export async function handler(event: APIGatewayProxyEvent) : Promise <APIGatewayProxyResult> {
    try {
        //Conseguir el callerId y el role del usuario desde el contexto de la función Lambda
        const callerId = event.requestContext.authorizer?.userId;
        const callerRole = event.requestContext.authorizer?.role;

        //Verificar que el callerId y el role existan
        if (callerRole !== "seller") {
            return forbidden("Solo los vendedores pueden crear productos");
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

        const product : Product = {
            productId: uuidv4(),
            sellerId: callerId,
            name,
            description,
            price,
            stock,
            createdAt: now,
            updatedAt: now
        };

            await dynamo.send(new PutCommand({
                TableName: PRODUCTS_TABLE,
                Item: product
            }));

        return create({ product });
    } catch (error) {
        console.error("Error en createProduct", error);
        return internalError();
    }
}

export const createProduct = withCors(handler);