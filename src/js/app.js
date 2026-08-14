import { store } from './store.js';
import { auth } from './auth.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.modal = document.getElementById('app-modal');
    this.init();
  }

  init() {
    this.setupAuthScreen();
    this.setupRoleSwitcher();

    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.logout();
      this.showToast('Logged out successfully', 'info');
      this.checkAuthState();
    });

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());

    this.checkAuthState();
  }

  setupAuthScreen() {
    document.querySelectorAll('.quick-login-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        const user = auth.loginByRole(role);
        if (user) {
          this.showToast(`Welcome! Logged in as ${user.name} (${user.role.toUpperCase()})`, 'success');
          this.checkAuthState();
        }
      });
    });
  }

  checkAuthState() {
    const user = auth.getCurrentUser();
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');

    if (user) {
      authScreen.style.display = 'none';
      appContainer.style.display = 'flex';
      this.renderSidebar();
      this.renderUserProfile();
      this.renderCurrentView();
    } else {
      authScreen.style.display = 'flex';
      appContainer.style.display = 'none';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  setupRoleSwitcher() {
    const roleSelect = document.getElementById('quick-role-select');
    roleSelect.addEventListener('change', (e) => {
      const newRole = e.target.value;
      auth.switchRole(newRole);
      this.showToast(`Switched active session role to ${newRole.toUpperCase()}`, 'info');
      this.renderSidebar();
      this.renderUserProfile();
      this.renderCurrentView();
    });
  }

  formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  }

  renderSidebar() {
    const user = auth.getCurrentUser();
    const role = user?.role || 'user';
    const menuContainer = document.getElementById('sidebar-menu');

    let navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['admin', 'staff', 'user'] },
      { id: 'products', label: 'Products & Inventory', icon: 'package', roles: ['admin', 'staff', 'user'] },
      { id: 'categories', label: 'Categories & Suppliers', icon: 'tags', roles: ['admin', 'staff'] },
      { id: 'orders', label: 'Orders & Requisitions', icon: 'shopping-cart', roles: ['admin', 'staff', 'user'] },
      { id: 'users', label: 'User Management', icon: 'users', roles: ['admin'] }
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(role));

    menuContainer.innerHTML = filteredNav.map(item => `
      <a class="nav-item ${this.currentView === item.id ? 'active' : ''}" data-view="${item.id}">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    menuContainer.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const view = el.getAttribute('data-view');
        this.navigate(view);
      });
    });
  }

  renderUserProfile() {
    const user = auth.getCurrentUser();
    if (user) {
      document.getElementById('user-avatar-text').textContent = user.name.charAt(0);
      document.getElementById('user-display-name').textContent = user.name;
      const roleBadge = document.getElementById('user-display-role');
      roleBadge.textContent = user.role.toUpperCase();
      roleBadge.className = `role-badge role-${user.role}`;

      const roleSelect = document.getElementById('quick-role-select');
      if (roleSelect) roleSelect.value = user.role;
    }
  }

  navigate(viewId) {
    this.currentView = viewId;
    this.renderSidebar();
    this.renderCurrentView();
  }

  renderCurrentView() {
    const content = document.getElementById('main-content');
    const titleEl = document.getElementById('page-title');

    switch (this.currentView) {
      case 'dashboard':
        titleEl.textContent = 'System Overview';
        this.renderDashboardView(content);
        break;
      case 'products':
        titleEl.textContent = 'Inventory Items & Stock';
        this.renderProductsView(content);
        break;
      case 'categories':
        titleEl.textContent = 'Categories & Suppliers';
        this.renderCategoriesView(content);
        break;
      case 'orders':
        titleEl.textContent = 'Orders & Requisitions';
        this.renderOrdersView(content);
        break;
      case 'users':
        titleEl.textContent = 'User Accounts & Roles';
        this.renderUsersView(content);
        break;
      default:
        this.renderDashboardView(content);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /* ---------------- Dashboard View ---------------- */
  renderDashboardView(container) {
    const products = store.getProducts();
    const orders = store.getOrders();
    const totalVal = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="package"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Products</div>
            <div class="stat-value">${products.length}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="indian-rupee"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Inventory Total Value</div>
            <div class="stat-value">${this.formatINR(totalVal)}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Low / Out of Stock</div>
            <div class="stat-value">${lowStockCount}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="clock"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Pending Orders</div>
            <div class="stat-value">${pendingOrders}</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 1.5rem;">
        <div class="card">
          <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Low Stock Warning Items</h3>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${products.filter(p => p.quantity <= p.minThreshold).map(p => `
                  <tr>
                    <td><strong>${p.name}</strong><br><small style="color:var(--text-muted);">${p.sku}</small></td>
                    <td>${p.categoryName || 'Unassigned'}</td>
                    <td><strong style="color:${p.quantity === 0 ? 'var(--danger)' : 'var(--warning)'}">${p.quantity} ${p.unit}</strong></td>
                    <td><span class="badge ${p.quantity === 0 ? 'badge-danger' : 'badge-warning'}">${p.status}</span></td>
                    <td>
                      ${auth.hasRole(['admin', 'staff']) ? `
                        <button class="btn btn-secondary btn-sm restock-btn" data-id="${p.id}">Restock</button>
                      ` : '<span style="color:var(--text-muted); font-size:0.8rem;">View Only</span>'}
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">No low stock alerts. System is clean!</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.restock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-id');
        this.openRestockModal(pId);
      });
    });
  }

  /* ---------------- Products View & CRUD ---------------- */
  renderProductsView(container) {
    const categories = store.getCategories();

    container.innerHTML = `
      <div class="controls-bar">
        <div style="display:flex; gap: 1rem; flex: 1;">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" id="product-search" placeholder="Search by SKU, Name or Location...">
          </div>

          <div class="filter-group">
            <select class="filter-select" id="category-filter">
              <option value="ALL">All Categories</option>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>

            <select class="filter-select" id="status-filter">
              <option value="ALL">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        ${auth.hasRole(['admin', 'staff']) ? `
          <button class="btn btn-primary" id="add-product-btn">
            <i data-lucide="plus"></i> Add Product
          </button>
        ` : ''}
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table" id="products-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Price (₹)</th>
                <th>Stock Qty</th>
                <th>Status</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="products-table-body">
              <!-- Rendered via updateProductsTable -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.updateProductsTable();

    document.getElementById('product-search').addEventListener('input', () => this.updateProductsTable());
    document.getElementById('category-filter').addEventListener('change', () => this.updateProductsTable());
    document.getElementById('status-filter').addEventListener('change', () => this.updateProductsTable());

    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openProductModal());
    }
  }

  updateProductsTable() {
    const userRole = auth.getCurrentUser()?.role;
    const query = document.getElementById('product-search')?.value.toLowerCase() || '';
    const catId = document.getElementById('category-filter')?.value || 'ALL';
    const statusVal = document.getElementById('status-filter')?.value || 'ALL';

    let products = store.getProducts().filter(p => {
      const matchSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || (p.location && p.location.toLowerCase().includes(query));
      const matchCat = catId === 'ALL' || p.categoryId === catId;
      const matchStatus = statusVal === 'ALL' || p.status === statusVal;
      return matchSearch && matchCat && matchStatus;
    });

    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">No products found. ${auth.hasRole(['admin', 'staff']) ? 'Click "Add Product" above to create your first item!' : ''}</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td><code style="background:var(--bg-main); padding: 0.2rem 0.4rem; border-radius: 4px;">${p.sku}</code></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.categoryName || 'Unassigned'}</td>
        <td><strong>${this.formatINR(p.price)}</strong></td>
        <td><strong>${p.quantity}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">${p.unit}</span></td>
        <td>
          <span class="badge ${p.status === 'In Stock' ? 'badge-success' : (p.status === 'Low Stock' ? 'badge-warning' : 'badge-danger')}">
            ${p.status}
          </span>
        </td>
        <td>${p.location || '-'}</td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            ${userRole === 'user' ? `
              <button class="btn btn-secondary btn-sm order-item-btn" data-id="${p.id}">Order</button>
            ` : `
              <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}">Edit</button>
              <button class="btn btn-secondary btn-sm restock-btn" data-id="${p.id}">Adjust</button>
              ${userRole === 'admin' ? `
                <button class="btn btn-danger btn-sm delete-prod-btn" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
              ` : ''}
            `}
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openProductModal(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.restock-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openRestockModal(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => this.confirmDeleteProduct(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.order-item-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openQuickOrderModal(btn.getAttribute('data-id')));
    });
  }

  /* Modals for Product CRUD */
  openProductModal(productId = null) {
    const isEdit = !!productId;
    const product = isEdit ? store.getProducts().find(p => p.id === productId) : null;
    const categories = store.getCategories();
    const suppliers = store.getSuppliers();

    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const submitBtn = document.getElementById('modal-submit-btn');

    titleEl.textContent = isEdit ? `Edit Product: ${product.name}` : 'Add New Inventory Product';

    bodyEl.innerHTML = `
      <form id="product-form">
        <div class="form-row">
          <div class="form-group">
            <label>SKU Code</label>
            <input type="text" id="p-sku" class="form-control" value="${product?.sku || ''}" required placeholder="e.g. PRD-001">
          </div>
          <div class="form-group">
            <label>Product Name</label>
            <input type="text" id="p-name" class="form-control" value="${product?.name || ''}" required placeholder="Product name">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="p-category" class="form-control">
              <option value="">-- Select Category --</option>
              ${categories.map(c => `<option value="${c.id}" ${product?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Supplier</label>
            <select id="p-supplier" class="form-control">
              <option value="">-- Select Supplier --</option>
              ${suppliers.map(s => `<option value="${s.id}" ${product?.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Price (₹ INR)</label>
            <input type="number" step="0.01" id="p-price" class="form-control" value="${product?.price || ''}" required placeholder="0.00">
          </div>
          <div class="form-group">
            <label>Initial Quantity</label>
            <input type="number" id="p-quantity" class="form-control" value="${product?.quantity ?? 10}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Min. Low Stock Alert Threshold</label>
            <input type="number" id="p-minThreshold" class="form-control" value="${product?.minThreshold ?? 5}" required>
          </div>
          <div class="form-group">
            <label>Unit (e.g. pcs, kg, boxes)</label>
            <input type="text" id="p-unit" class="form-control" value="${product?.unit || 'pcs'}" required>
          </div>
        </div>

        <div class="form-group">
          <label>Warehouse Storage Location</label>
          <input type="text" id="p-location" class="form-control" value="${product?.location || ''}" placeholder="e.g. Rack A, Shelf 2">
        </div>
      </form>
    `;

    this.openModal();

    submitBtn.onclick = () => {
      const form = document.getElementById('product-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const catSelect = document.getElementById('p-category');
      const supSelect = document.getElementById('p-supplier');

      const data = {
        sku: document.getElementById('p-sku').value,
        name: document.getElementById('p-name').value,
        categoryId: catSelect.value || '',
        categoryName: catSelect.value ? catSelect.options[catSelect.selectedIndex].text : '',
        supplierId: supSelect.value || '',
        supplierName: supSelect.value ? supSelect.options[supSelect.selectedIndex].text : '',
        price: parseFloat(document.getElementById('p-price').value),
        quantity: parseInt(document.getElementById('p-quantity').value),
        minThreshold: parseInt(document.getElementById('p-minThreshold').value),
        unit: document.getElementById('p-unit').value,
        location: document.getElementById('p-location').value
      };

      if (isEdit) {
        data.id = productId;
        store.updateProduct(data, auth.getCurrentUser());
        this.showToast('Product updated successfully!', 'success');
      } else {
        store.addProduct(data, auth.getCurrentUser());
        this.showToast('New product added to inventory!', 'success');
      }

      this.closeModal();
      this.updateProductsTable();
    };
  }

  openRestockModal(productId) {
    const product = store.getProducts().find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modal-title').textContent = `Stock Adjustment: ${product.name}`;
    document.getElementById('modal-body').innerHTML = `
      <form id="restock-form">
        <p style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted);">Current Quantity: <strong>${product.quantity} ${product.unit}</strong></p>
        <div class="form-group">
          <label>Quantity Adjustment (+ to add, - to reduce)</label>
          <input type="number" id="adj-qty" class="form-control" value="10" required>
        </div>
        <div class="form-group">
          <label>Reason / Note</label>
          <input type="text" id="adj-reason" class="form-control" value="Inventory Restock" required>
        </div>
      </form>
    `;

    this.openModal();

    document.getElementById('modal-submit-btn').onclick = () => {
      const changeQty = parseInt(document.getElementById('adj-qty').value);
      const reason = document.getElementById('adj-reason').value;

      store.adjustStock(productId, changeQty, reason, auth.getCurrentUser());
      this.showToast(`Stock updated for ${product.name}`, 'success');
      this.closeModal();
      this.renderCurrentView();
    };
  }

  confirmDeleteProduct(productId) {
    const product = store.getProducts().find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modal-title').textContent = 'Confirm Product Deletion';
    document.getElementById('modal-body').innerHTML = `
      <p>Are you sure you want to delete <strong>${product.name}</strong> (${product.sku})?</p>
      <p style="color: var(--danger); font-size: 0.85rem; margin-top: 0.5rem;">This action cannot be undone.</p>
    `;

    this.openModal();

    document.getElementById('modal-submit-btn').className = 'btn btn-danger';
    document.getElementById('modal-submit-btn').onclick = () => {
      store.deleteProduct(productId, auth.getCurrentUser());
      this.showToast('Product removed from inventory', 'info');
      document.getElementById('modal-submit-btn').className = 'btn btn-primary';
      this.closeModal();
      this.updateProductsTable();
    };
  }

  openQuickOrderModal(productId) {
    const product = store.getProducts().find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modal-title').textContent = `Order Item: ${product.name}`;
    document.getElementById('modal-body').innerHTML = `
      <form id="quick-order-form">
        <p style="margin-bottom: 0.75rem; font-size: 0.9rem;">Unit Price: <strong>${this.formatINR(product.price)}</strong> | Available: <strong>${product.quantity} ${product.unit}</strong></p>
        <div class="form-group">
          <label>Quantity to Order</label>
          <input type="number" id="order-qty" class="form-control" value="1" min="1" max="${product.quantity}" required>
        </div>
      </form>
    `;

    this.openModal();

    document.getElementById('modal-submit-btn').onclick = () => {
      const qty = parseInt(document.getElementById('order-qty').value);
      const user = auth.getCurrentUser();

      const orderData = {
        userId: user.id,
        userName: user.name,
        items: [
          { productId: product.id, name: product.name, quantity: qty, unitPrice: product.price }
        ],
        totalAmount: qty * product.price
      };

      store.createOrder(orderData, user);
      this.showToast('Order placed successfully!', 'success');
      this.closeModal();
    };
  }

  /* ---------------- Categories & Suppliers View ---------------- */
  renderCategoriesView(container) {
    const categories = store.getCategories();
    const suppliers = store.getSuppliers();

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div class="card">
          <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 1rem;">
            <h3>Categories (${categories.length})</h3>
            <button class="btn btn-secondary btn-sm" id="add-cat-btn"><i data-lucide="plus"></i> New Category</button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${categories.map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td style="color:var(--text-muted); font-size:0.85rem;">${c.description || '-'}</td>
                    <td>
                      ${auth.hasRole('admin') ? `
                        <button class="btn btn-danger btn-sm del-cat-btn" data-id="${c.id}"><i data-lucide="trash-2"></i></button>
                      ` : '-'}
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="3" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No categories added yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 1rem;">
            <h3>Suppliers (${suppliers.length})</h3>
            <button class="btn btn-secondary btn-sm" id="add-sup-btn"><i data-lucide="plus"></i> New Supplier</button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact Person</th>
                  <th>Email / Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${suppliers.map(s => `
                  <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.contactPerson || '-'}</td>
                    <td><small style="color:var(--text-muted);">${s.email || ''}<br>${s.phone || ''}</small></td>
                    <td>
                      ${auth.hasRole('admin') ? `
                        <button class="btn btn-danger btn-sm del-sup-btn" data-id="${s.id}"><i data-lucide="trash-2"></i></button>
                      ` : '-'}
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No suppliers added yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('add-cat-btn')?.addEventListener('click', () => {
      document.getElementById('modal-title').textContent = 'Create New Category';
      document.getElementById('modal-body').innerHTML = `
        <div class="form-group">
          <label>Category Name</label>
          <input type="text" id="cat-name" class="form-control" placeholder="e.g. Electronics" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" id="cat-desc" class="form-control" placeholder="Short description">
        </div>
      `;
      this.openModal();
      document.getElementById('modal-submit-btn').onclick = () => {
        const name = document.getElementById('cat-name').value;
        const description = document.getElementById('cat-desc').value;
        if (name) {
          store.addCategory({ name, description }, auth.getCurrentUser());
          this.showToast('Category created!', 'success');
          this.closeModal();
          this.renderCategoriesView(container);
        }
      };
    });

    document.getElementById('add-sup-btn')?.addEventListener('click', () => {
      document.getElementById('modal-title').textContent = 'Add Supplier';
      document.getElementById('modal-body').innerHTML = `
        <div class="form-group">
          <label>Supplier Company Name</label>
          <input type="text" id="sup-name" class="form-control" placeholder="e.g. Prime Distributors" required>
        </div>
        <div class="form-group">
          <label>Contact Person Name</label>
          <input type="text" id="sup-contact" class="form-control" placeholder="e.g. Rajesh Kumar">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="sup-email" class="form-control" placeholder="contact@supplier.in">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="sup-phone" class="form-control" placeholder="+91 9876543210">
          </div>
        </div>
      `;
      this.openModal();
      document.getElementById('modal-submit-btn').onclick = () => {
        const name = document.getElementById('sup-name').value;
        const contactPerson = document.getElementById('sup-contact').value;
        const email = document.getElementById('sup-email').value;
        const phone = document.getElementById('sup-phone').value;

        if (name) {
          store.addSupplier({ name, contactPerson, email, phone }, auth.getCurrentUser());
          this.showToast('Supplier added!', 'success');
          this.closeModal();
          this.renderCategoriesView(container);
        }
      };
    });

    container.querySelectorAll('.del-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.deleteCategory(btn.getAttribute('data-id'), auth.getCurrentUser());
        this.showToast('Category deleted', 'info');
        this.renderCategoriesView(container);
      });
    });

    container.querySelectorAll('.del-sup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.deleteSupplier(btn.getAttribute('data-id'), auth.getCurrentUser());
        this.showToast('Supplier deleted', 'info');
        this.renderCategoriesView(container);
      });
    });
  }

  /* ---------------- Orders View ---------------- */
  renderOrdersView(container) {
    const userRole = auth.getCurrentUser()?.role;
    const currentUser = auth.getCurrentUser();
    let orders = store.getOrders();

    if (userRole === 'user') {
      orders = orders.filter(o => o.userId === currentUser.id);
    }

    container.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom: 1rem;">${userRole === 'user' ? 'My Order History' : 'All Customer & Staff Requisitions'}</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Value (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>${o.id}</strong></td>
                  <td>${o.userName}</td>
                  <td><small style="color:var(--text-muted);">${o.createdAt}</small></td>
                  <td>
                    ${o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </td>
                  <td><strong>${this.formatINR(o.totalAmount)}</strong></td>
                  <td>
                    <span class="badge ${o.status === 'Fulfilled' ? 'badge-success' : (o.status === 'Pending' ? 'badge-warning' : 'badge-danger')}">
                      ${o.status}
                    </span>
                  </td>
                  <td>
                    ${auth.hasRole(['admin', 'staff']) && o.status === 'Pending' ? `
                      <button class="btn btn-success btn-sm fulfill-btn" data-id="${o.id}">Approve & Fulfill</button>
                      <button class="btn btn-danger btn-sm cancel-btn" data-id="${o.id}">Reject</button>
                    ` : '-'}
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No orders found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.fulfill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.updateOrderStatus(btn.getAttribute('data-id'), 'Fulfilled', auth.getCurrentUser());
        this.showToast('Order approved and stock updated!', 'success');
        this.renderOrdersView(container);
      });
    });

    container.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.updateOrderStatus(btn.getAttribute('data-id'), 'Cancelled', auth.getCurrentUser());
        this.showToast('Order rejected', 'info');
        this.renderOrdersView(container);
      });
    });
  }

  /* ---------------- Users Management View (Admin) ---------------- */
  renderUsersView(container) {
    const users = store.getUsers();

    container.innerHTML = `
      <div class="controls-bar">
        <h3>User Accounts & Role Permissions</h3>
        <button class="btn btn-primary" id="add-user-btn"><i data-lucide="user-plus"></i> Create User</button>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Current Role</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${u.name}</strong></td>
                  <td>${u.email}</td>
                  <td><span class="role-badge role-${u.role}">${u.role.toUpperCase()}</span></td>
                  <td>${u.createdAt}</td>
                  <td><span class="badge badge-success">${u.status}</span></td>
                  <td>
                    <select class="filter-select role-change-select" data-id="${u.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                      <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>Staff</option>
                      <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.role-change-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const uId = sel.getAttribute('data-id');
        const newRole = e.target.value;
        store.updateUserRole(uId, newRole, auth.getCurrentUser());
        this.showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
        this.renderUsersView(container);
      });
    });

    document.getElementById('add-user-btn')?.addEventListener('click', () => {
      document.getElementById('modal-title').textContent = 'Create New User Account';
      document.getElementById('modal-body').innerHTML = `
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="u-name" class="form-control" placeholder="e.g. Rahul Sharma" required>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="u-email" class="form-control" placeholder="rahul@inventory.in" required>
        </div>
        <div class="form-group">
          <label>Role</label>
          <select id="u-role" class="form-control">
            <option value="user">User (Customer / Viewer)</option>
            <option value="staff">Staff (Stock Manager)</option>
            <option value="admin">Admin (Full Control)</option>
          </select>
        </div>
      `;
      this.openModal();
      document.getElementById('modal-submit-btn').onclick = () => {
        const name = document.getElementById('u-name').value;
        const email = document.getElementById('u-email').value;
        const role = document.getElementById('u-role').value;

        if (name && email) {
          store.addUser({ name, email, role }, auth.getCurrentUser());
          this.showToast('New user registered successfully!', 'success');
          this.closeModal();
          this.renderUsersView(container);
        }
      };
    });
  }

  /* Helper Modal & Toast Methods */
  openModal() {
    this.modal.classList.add('active');
  }

  closeModal() {
    this.modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize Application
new App();
