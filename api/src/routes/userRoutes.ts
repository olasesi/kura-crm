import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin console)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated users
 */
router.get("/", authorize(UserRole.ADMIN, UserRole.MANAGER), UserController.getAll);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, manager, user] }
 *               roleName: { type: string, description: "Custom role slug or id" }
 *             required: [firstName, lastName, email]
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already in use
 */
router.post("/", authorize(UserRole.ADMIN), UserController.create);

/**
 * @swagger
 * /api/users/{id}/active:
 *   patch:
 *     summary: Activate or deactivate a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive: { type: boolean }
 *             required: [isActive]
 *     responses:
 *       200:
 *         description: User state updated
 *       409:
 *         description: Cannot deactivate self or last admin
 */
router.patch("/:id/active", authorize(UserRole.ADMIN), UserController.setActive);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Assign a role to a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, description: "Role slug, id, or custom role name" }
 *             required: [role]
 *     responses:
 *       200:
 *         description: Role assigned
 *       404:
 *         description: User or role not found
 *       409:
 *         description: Last admin protection
 */
router.put("/:id/role", authorize(UserRole.ADMIN), UserController.assignRole);

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Reset a user's password (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword: { type: string }
 *             required: [newPassword]
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Password too short
 */
router.put("/:id/password", authorize(UserRole.ADMIN), UserController.resetPassword);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User
 *       404:
 *         description: User not found
 */
router.get("/:id", authorize(UserRole.ADMIN, UserRole.MANAGER), UserController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               role: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put("/:id", authorize(UserRole.ADMIN), UserController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 *       409:
 *         description: Cannot delete self or last admin
 */
router.delete("/:id", authorize(UserRole.ADMIN), UserController.delete);

/**
 * @swagger
 * /api/users/password/change:
 *   put:
 *     summary: Change your own password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *             required: [currentPassword, newPassword]
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put("/password/change", UserController.changePassword);

export default router;
