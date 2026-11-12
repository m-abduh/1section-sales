import { prisma } from "../../lib/prisma";
import { paddle } from "../../lib/paddle";
import { ApiError } from "../../utils/api-error";
import type { CreateCheckoutInput } from "./checkout.schema";

export interface CheckoutResult {
  transactionId: string;
  checkoutUrl: string;
}

export async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CheckoutResult> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product || !product.active) {
    throw ApiError.notFound("Product not found");
  }

  if (!product.paddlePriceId) {
    throw ApiError.badRequest(
      "Product is not linked to a Paddle price yet. Add a Paddle price ID in admin.",
    );
  }

  try {
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: product.paddlePriceId,
          quantity: 1,
        },
      ],
      customData: {
        productId: product.id,
      },
    });

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      throw ApiError.badRequest(
        "Paddle did not return a checkout URL for this price",
      );
    }

    return {
      transactionId: transaction.id,
      checkoutUrl,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Paddle checkout failed";
    throw new ApiError(502, `Paddle checkout error: ${message}`, {
      code: "PADDLE_ERROR",
    });
  }
}
