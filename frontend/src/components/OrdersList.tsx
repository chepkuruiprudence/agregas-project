import {OrderCard} from './Ordercard ';

interface Order {
  id: number;
  brand: string;
  cylinderSize: string;
  quantity: number;
  finalPrice: string;
  status: string;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
  deliveryTime?: string;
}

interface OrdersListProps {
  orders: Order[];
  onCancelOrder: (orderId: number) => void;
}

export const OrdersList = ({ orders, onCancelOrder }: OrdersListProps) => {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onCancel={onCancelOrder}
        />
      ))}
    </div>
  );
};