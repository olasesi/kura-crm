import { Router } from "express";
import { RoleController } from "../controllers/roleController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and permission management (RBAC)
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List roles (built-in + custom)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *         description: Only return active roles
 *     responses:
 *       200:
 *         description: Role definitions merged from built-in registry and stored rows
 */
router.get("/", authorize(UserRole.ADMIN, UserRole.MANAGER), RoleController.list);

/**
 * @swagger
 * /api/roles/catalog:
 *   get:
 *     summary: List the permission catalog used to build roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission modules with their permission keys
 */
router.get("/catalog", authorize(UserRole.ADMIN, UserRole.MANAGER), RoleController.catalog);

/**
 * @swagger
 * /api/roles/{ref}:
 *   get:
 *     summary: Get a single role by id or name
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         description: Role id or role slug (e.g. admin, manager, user)
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role definition
 *       404:
 *         description: Role not found
 */
router.get("/:ref", authorize(UserRole.ADMIN, UserRole.MANAGER), RoleController.getById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a custom role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               permissions: { type: array, items: { type: string } }
 *               isActive: { type: boolean }
 *             required: [name]
 *     responses:
 *       201:
 *         description: Role created
 *       400:
 *         description: Invalid name or unknown permission
 *       409:
 *         description: Role already exists
 */
router.post("/", authorize(UserRole.ADMIN), RoleController.create);

/**
 * @swagger
 * /api/roles/{ref}:
 *   put:
 *     summary: Update a role's description, permissions, or active state
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         description: Role id or name
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string }
 *               permissions: { type: array, items: { type: string } }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Cannot rename or deactivate a system role
 *       404:
 *         description: Role not found
 */
router.put("/:ref", authorize(UserRole.ADMIN), RoleController.update);

/**
 * @swagger
 * /api/roles/{ref}:
 *   delete:
 *     summary: Delete a custom role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ref
 *         required: true
 *         description: Role id or name
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role deleted
 *       403:
 *         description: System roles cannot be deleted
 *       409:
 *         description: Role is assigned to users
 */
router.delete("/:ref", authorize(UserRole.ADMIN), RoleController.remove);

export default router;