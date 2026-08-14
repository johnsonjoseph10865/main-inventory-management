export class Store {
  constructor() {
    this.init();
  }

  init() {
    // Fresh start - empty arrays if not present or reset
    if (!localStorage.getItem('inv_users')) {
      const initialUsers = [
        { id: 'usr-1', name: 'Admin User', email: 'admin@inventory.in', password: 'admin123', role: 'admin', status: 'active', createdAt: new Date().toISOString().split('T')[0] },
        { id: 'usr-2', name: 'Staff User', email: 'staff@inventory.in', password: 'staff123', role: 'staff', status: 'active', createdAt: new Date().toISOString().split('T')[0] },
        { id: 'usr-3', name: 'Customer User', email: 'user@inventory.in', password: 'user123', role: 'user', status: 'active', createdAt: new Date().toISOString().split('T')[0] }
      ];
      localStorage.setItem('inv_users', JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem('inv_categories')) {
      localStorage.setItem('inv_categories', JSON.stringify([]));
    }
    if (!localStorage.getItem('inv_suppliers')) {
      localStorage.setItem('inv_suppliers', JSON.stringify([]));
    }
    if (!localStorage.getItem('inv_products')) {
      localStorage.setItem('inv_products', JSON.stringify([]));
    }
    if (!localStorage.getItem('inv_orders')) {
      localStorage.setItem('inv_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('inv_logs')) {
      localStorage.setItem('inv_logs', JSON.stringify([]));
    }
  }

  // Clear data utility
  clearData() {
    localStorage.removeItem('inv_categories');
    localStorage.removeItem('inv_suppliers');
    localStorage.removeItem('inv_products');
    localStorage.removeItem('inv_orders');
    localStorage.removeItem('inv_logs');
    this.init();
  }

  // Getters
  getUsers() { return JSON.parse(localStorage.getItem('inv_users') || '[]'); }
  getCategories() { return JSON.parse(localStorage.getItem('inv_categories') || '[]'); }
  getSuppliers() { return JSON.parse(localStorage.getItem('inv_suppliers') || '[]'); }
  getProducts() { return JSON.parse(localStorage.getItem('inv_products') || '[]'); }
  getOrders() { return JSON.parse(localStorage.getItem('inv_orders') || '[]'); }
  getLogs() { return JSON.parse(localStorage.getItem('inv_logs') || '[]'); }

  // Product CRUD
  addProduct(product, actor) {
    const products = this.getProducts();
    const newProduct = {
      id: 'prod-' + Date.now(),
      status: Number(product.quantity) <= 0 ? 'Out of Stock' : (Number(product.quantity) <= Number(product.minThreshold) ? 'Low Stock' : 'In Stock'),
      ...product
    };
    products.unshift(newProduct);
    localStorage.setItem('inv_products', JSON.stringify(products));
    this.addLog(actor, 'Create Product', `Created product "${newProduct.name}" (SKU: ${newProduct.sku})`);
    return newProduct;
  }

  updateProduct(updatedProd, actor) {
    let products = this.getProducts();
    const index = products.findIndex(p => p.id === updatedProd.id);
    if (index !== -1) {
      updatedProd.status = Number(updatedProd.quantity) <= 0 ? 'Out of Stock' : (Number(updatedProd.quantity) <= Number(updatedProd.minThreshold) ? 'Low Stock' : 'In Stock');
      products[index] = { ...products[index], ...updatedProd };
      localStorage.setItem('inv_products', JSON.stringify(products));
      this.addLog(actor, 'Update Product', `Updated product details for "${updatedProd.name}"`);
      return true;
    }
    return false;
  }

  deleteProduct(id, actor) {
    let products = this.getProducts();
    const target = products.find(p => p.id === id);
    if (target) {
      products = products.filter(p => p.id !== id);
      localStorage.setItem('inv_products', JSON.stringify(products));
      this.addLog(actor, 'Delete Product', `Deleted product "${target.name}"`);
      return true;
    }
    return false;
  }

  adjustStock(id, changeQty, reason, actor) {
    const products = this.getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
      const oldQty = Number(product.quantity);
      const newQty = Math.max(0, oldQty + Number(changeQty));
      product.quantity = newQty;
      product.status = newQty <= 0 ? 'Out of Stock' : (newQty <= Number(product.minThreshold) ? 'Low Stock' : 'In Stock');
      localStorage.setItem('inv_products', JSON.stringify(products));
      this.addLog(actor, 'Stock Adjustment', `Adjusted stock for ${product.name} from ${oldQty} to ${newQty}. Reason: ${reason}`);
      return true;
    }
    return false;
  }

  // Category CRUD
  addCategory(category, actor) {
    const categories = this.getCategories();
    const newCat = { id: 'cat-' + Date.now(), itemCount: 0, ...category };
    categories.unshift(newCat);
    localStorage.setItem('inv_categories', JSON.stringify(categories));
    this.addLog(actor, 'Create Category', `Created category "${newCat.name}"`);
  }

  deleteCategory(id, actor) {
    let categories = this.getCategories();
    const target = categories.find(c => c.id === id);
    if (target) {
      categories = categories.filter(c => c.id !== id);
      localStorage.setItem('inv_categories', JSON.stringify(categories));
      this.addLog(actor, 'Delete Category', `Deleted category "${target.name}"`);
    }
  }

  // Supplier CRUD
  addSupplier(supplier, actor) {
    const suppliers = this.getSuppliers();
    const newSup = { id: 'sup-' + Date.now(), ...supplier };
    suppliers.unshift(newSup);
    localStorage.setItem('inv_suppliers', JSON.stringify(suppliers));
    this.addLog(actor, 'Create Supplier', `Added supplier "${newSup.name}"`);
  }

  deleteSupplier(id, actor) {
    let suppliers = this.getSuppliers();
    const target = suppliers.find(s => s.id === id);
    if (target) {
      suppliers = suppliers.filter(s => s.id !== id);
      localStorage.setItem('inv_suppliers', JSON.stringify(suppliers));
      this.addLog(actor, 'Delete Supplier', `Deleted supplier "${target.name}"`);
    }
  }

  // Orders Workflow
  createOrder(orderData, actor) {
    const orders = this.getOrders();
    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Pending',
      createdAt: new Date().toLocaleString('en-IN'),
      ...orderData
    };
    orders.unshift(newOrder);
    localStorage.setItem('inv_orders', JSON.stringify(orders));
    this.addLog(actor, 'Create Order', `Order ${newOrder.id} placed by ${orderData.userName}`);
    return newOrder;
  }

  updateOrderStatus(orderId, status, actor) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem('inv_orders', JSON.stringify(orders));
      
      // Deduct inventory stock when order is fulfilled
      if (status === 'Fulfilled') {
        order.items.forEach(item => {
          this.adjustStock(item.productId, -item.quantity, `Fulfilled Order ${orderId}`, actor);
        });
      }

      this.addLog(actor, 'Order Status Change', `Order ${orderId} marked as ${status}`);
      return true;
    }
    return false;
  }

  // Users Management (Admin)
  addUser(userData, actor) {
    const users = this.getUsers();
    const newUser = {
      id: 'usr-' + Date.now(),
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      ...userData
    };
    users.push(newUser);
    localStorage.setItem('inv_users', JSON.stringify(users));
    this.addLog(actor, 'Create User', `Created user account ${newUser.email} with role ${newUser.role}`);
    return newUser;
  }

  updateUserRole(userId, newRole, actor) {
    const users = this.getUsers();
    const u = users.find(user => user.id === userId);
    if (u) {
      const oldRole = u.role;
      u.role = newRole;
      localStorage.setItem('inv_users', JSON.stringify(users));
      this.addLog(actor, 'Update User Role', `Changed ${u.name}'s role from ${oldRole} to ${newRole}`);
      return true;
    }
    return false;
  }

  addLog(actor, action, details) {
    const logs = this.getLogs();
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('en-IN'),
      user: actor ? actor.name : 'System',
      role: actor ? actor.role : 'system',
      action,
      details
    };
    logs.unshift(newLog);
    localStorage.setItem('inv_logs', JSON.stringify(logs.slice(0, 100)));
  }
}

export const store = new Store();
