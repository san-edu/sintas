import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/services/auth/password.js'
import { canAccessRole } from '../../src/domain/permissions.js'
import { forgotPasswordSchema, loginSchema, profileSchema } from '../../src/schemas/auth.schemas.js'

describe('auth domain', () => {
  it('hashes and verifies passwords with Argon2id', async () => {
    const hash = await hashPassword('correct-password')
    expect(hash).toMatch(/^\$argon2id\$/)
    await expect(verifyPassword(hash, 'correct-password')).resolves.toBe(true)
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false)
  })

  it('validates login, reset confirmation, and editable profile fields', () => {
    expect(loginSchema.safeParse({ username: 'student', password: 'short' }).success).toBe(false)
    expect(forgotPasswordSchema.safeParse({ email: 'a@example.com', birthDate: '2000-01-01', password: 'password-123', passwordConfirmation: 'different' }).success).toBe(false)
    expect(profileSchema.safeParse({ username: 'cannot-edit' }).success).toBe(false)
    expect(profileSchema.safeParse({ name: 'Updated name' }).success).toBe(true)
  })

  it('allows only explicitly authorized roles', () => {
    expect(canAccessRole('ADMIN', ['ADMIN'])).toBe(true)
    expect(canAccessRole('TEACHER', ['ADMIN'])).toBe(false)
    expect(canAccessRole('STUDENT', ['STUDENT', 'TEACHER'])).toBe(true)
  })
})
