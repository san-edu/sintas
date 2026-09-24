import { assertRole } from '../domain/permissions.js'

export function authorize(...roles) {
  return (req, _res, next) => {
    try {
      assertRole(req.user?.role, roles)
      next()
    } catch (error) {
      next(error)
    }
  }
}
