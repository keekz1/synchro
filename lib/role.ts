//
import { UserRole } from '@prisma/client';

export async function getRoles() {
  try {
    const excludedRoles = ['HR', 'USER', 'ADMIN'];
    const roles = Object.values(UserRole)
      .filter(role => !excludedRoles.includes(role))
      .map(role => ({
        value: role,
        label: role.replace(/_/g, ' ')
      }));
    return { data: roles, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to fetch roles' };
  }
}