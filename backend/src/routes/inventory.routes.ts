import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';

const router = Router();

// Get retailer inventory
router.get('/:retailerId/inventory', authenticateToken, async (req, res, next) => {
  try {
    const { retailerId } = req.params;
    const parsedRetailerId = Number(retailerId);
    
    // Verify ownership
    if (req.user?.userId !== parsedRetailerId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const inventory = await inventoryService.getRetailerInventory(parsedRetailerId);
    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
});

// Add inventory
router.post('/:retailerId/inventory', authenticateToken, async (req, res, next) => {
  try {
    const { retailerId } = req.params;
    const { productName, quantity, price, unit } = req.body;
    const parsedRetailerId = Number(retailerId);

    // Verify ownership
    if (req.user?.userId !== parsedRetailerId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate
    if (!productName || !quantity || !price || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const inventory = await inventoryService.addInventory(
      parsedRetailerId,
      productName,
      parseInt(quantity),
      parseFloat(price),
      unit
    );

    res.status(201).json({ 
      success: true, 
      message: 'Inventory added successfully',
      data: inventory 
    });
  } catch (error) {
    next(error);
  }
});

// Update inventory
router.put('/:retailerId/inventory/:inventoryId', authenticateToken, async (req, res, next) => {
  try {
    const { retailerId, inventoryId } = req.params;
    const { quantity, price } = req.body;

    // Verify ownership
    const parsedRetailerId = Number(retailerId);
    if (req.user?.userId !== parsedRetailerId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updates: any = {};
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (price !== undefined) updates.price = parseFloat(price);

    const inventory = await inventoryService.updateInventory(
      inventoryId as string,
      parsedRetailerId,
      updates
    );

    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
});

// Delete inventory
router.delete('/:retailerId/inventory/:inventoryId', authenticateToken, async (req, res, next) => {
  try {
    const { retailerId, inventoryId } = req.params;

    // Verify ownership
    const parsedRetailerId = Number(retailerId);
    if (req.user?.userId !== parsedRetailerId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await inventoryService.deleteInventory(inventoryId as string, parsedRetailerId);

    res.json({ success: true, message: 'Inventory deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;