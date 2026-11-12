import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseParams, parseQuery, rateLimit, clientIp } from "@/lib/server/next-helpers";
import { ApiError } from "@/lib/server/utils/api-error";
import { orderStatusLookupSchema, orderStatusQuerySchema } from "@/lib/server/modules/orders/order.schema";
import * as orderService from "@/lib/server/modules/orders/order.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    parseParams({ orderNumber }, orderStatusLookupSchema);
    const q = parseQuery(req, orderStatusQuerySchema);
    if (!rateLimit(`orderstatus:${clientIp(req)}`, 30, 60 * 1000)) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }, { status: 429 });
    }
    const order = await orderService.getOrderStatus(orderNumber, { email: q.email, accessToken: q.access });
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    return ok(order);
  } catch (e) {
    return fail(e);
  }
}

