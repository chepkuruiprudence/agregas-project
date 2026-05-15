export interface CreateOrderRequest {
  brand: string;
  cylinderSize: string;
  quantity: number;
  deliveryAddress: string;
  paymentMethod: "mpesa" | "card" | "cash";
}

export interface OrderResponse {
  id: number;
  customerId: number;
  retailerId: number;
  status: string;
  quantity: number;
  brand: string;
  finalPrice: string;
  deliveryTime: string | null;
  deliveryAddress: string | null;
  estimatedDelivery: string;
  retailerName: string;
  createdAt: Date;
}

export interface UpdateOrderStatusRequest {
  status: "pending" | "confirmed" | "processing" | "in_delivery" | "delivered" | "cancelled";
}