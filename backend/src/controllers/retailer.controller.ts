// backend/src/controllers/retailer.controller.ts
import { Request, Response, NextFunction } from "express";
import { retailerService } from "../services/retailer.service";
import { AppError } from "../middleware/errorHandler";

// ─── Dashboard endpoints (called by RetailerDashboard.tsx) ──────────────────

/** GET /api/retailer/stats */
export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await retailerService.getRetailerStats(req.user!.userId);
    res.status(200).json({ success: true, statusCode: 200, message: "Stats retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** GET /api/retailer/orders */
export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await retailerService.getRetailerOrders(req.user!.userId);
    res.status(200).json({ success: true, statusCode: 200, message: "Orders retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** GET /api/retailer/inventory */
export async function getInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await retailerService.getRetailerInventory(req.user!.userId);
    res.status(200).json({ success: true, statusCode: 200, message: "Inventory retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** GET /api/retailer/mpesa-settings */
export async function getMPesaSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await retailerService.getMPesaSettings(req.user!.userId);
    res.status(200).json({ success: true, statusCode: 200, message: "M-Pesa settings retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** PUT /api/retailer/mpesa-settings */
export async function saveMPesaSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body as { phone: string };
    if (!phone) throw new AppError(400, "Phone number is required");
    const data = await retailerService.updateMPesaSettings(req.user!.userId, phone);
    res.status(200).json({ success: true, statusCode: 200, message: "M-Pesa settings saved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

// ─── Parameterised endpoints ─────────────────────────────────────────────────

/** GET /api/retailer/inventory/:retailerId */
export async function getInventoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await retailerService.getRetailerInventory(req.user!.userId);
    res.status(200).json({ success: true, statusCode: 200, message: "Inventory retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** PUT /api/retailer/inventory/:retailerId */
export async function updateInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const { newQuantity, itemId = 1 } = req.body;
    if (newQuantity === undefined) throw new AppError(400, "newQuantity is required");
    const data = await retailerService.updateInventoryItem(req.user!.userId, itemId, newQuantity);
    res.status(200).json({ success: true, statusCode: 200, message: "Inventory updated", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** GET /api/retailer/orders/pending/:retailerId */
export async function getPendingOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const all = await retailerService.getRetailerOrders(req.user!.userId, 50);
    const data = all.filter((o: any) => o.status === "pending");
    res.status(200).json({ success: true, statusCode: 200, message: "Pending orders retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** PUT /api/retailer/orders/:retailerId/:orderId/accept */
export async function acceptOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    if (!orderId) throw new AppError(400, "Order ID is required");
    const data = await retailerService.acceptOrder(req.user!.userId, parseInt(orderId as string));
    res.status(200).json({ success: true, statusCode: 200, message: "Order accepted", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** PUT /api/retailer/orders/:retailerId/:orderId/reject */
export async function rejectOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    if (!orderId) throw new AppError(400, "Order ID is required");
    const data = await retailerService.rejectOrder(req.user!.userId, parseInt(orderId as string ));
    res.status(200).json({ success: true, statusCode: 200, message: "Order rejected", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}

/** GET /api/retailer/analytics/:retailerId */
export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';
    const data = await retailerService.getPerformanceMetrics(req.user!.userId, period);
    res.status(200).json({ success: true, statusCode: 200, message: "Analytics retrieved", data, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
}