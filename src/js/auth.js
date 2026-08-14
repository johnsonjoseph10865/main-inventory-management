import { store } from './store.js';

export class AuthManager {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('inv_current_user')) || null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  loginByRole(role) {
    const users = store.getUsers();
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      this.currentUser = targetUser;
      localStorage.setItem('inv_current_user', JSON.stringify(targetUser));
      store.addLog(targetUser, 'User Login', `Logged in via quick dummy login screen`);
      return targetUser;
    }
    return null;
  }

  logout() {
    if (this.currentUser) {
      store.addLog(this.currentUser, 'User Logout', `Logged out`);
    }
    this.currentUser = null;
    localStorage.removeItem('inv_current_user');
  }

  switchRole(role) {
    return this.loginByRole(role);
  }

  hasRole(allowedRoles) {
    if (!this.currentUser) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(this.currentUser.role);
    }
    return this.currentUser.role === allowedRoles;
  }
}

export const auth = new AuthManager();
