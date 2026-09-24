import { Router } from "express";
import { SettingController } from "../controllers/settingController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Company-wide and per-user configuration settings
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all settings groups (aggregate)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All settings grouped by name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       403:
 *         description: Admin only
 */
router.get("/", authorize(UserRole.ADMIN), SettingController.getAll);

/**
 * @swagger
 * /api/settings/groups:
 *   get:
 *     summary: List available settings groups
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings group metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   group:
 *                     type: string
 *                   description:
 *                     type: string
 *                   scope:
 *                     type: string
 *                     enum: [global, user, both]
 *                   sensitive:
 *                     type: boolean
 */
router.get("/groups", SettingController.listGroups);

/**
 * @swagger
 * /api/settings/{group}/me:
 *   get:
 *     summary: Get the calling user's settings for a group
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User-scoped settings
 *       404:
 *         description: Unknown settings group
 */
router.get("/:group/me", SettingController.getMyGroup);

/**
 * @swagger
 * /api/settings/{group}/me:
 *   put:
 *     summary: Update the calling user's settings for a group
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated user-scoped settings
 *       403:
 *         description: Group is company-level
 *       404:
 *         description: Unknown settings group
 */
router.put("/:group/me", SettingController.updateMyGroup);

/**
 * @swagger
 * /api/settings/{group}:
 *   get:
 *     summary: Get global settings for a group
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Global settings for the group (sensitive values redacted for non-admins)
 *       404:
 *         description: Unknown settings group
 */
router.get("/:group", SettingController.getGroup);

/**
 * @swagger
 * /api/settings/{group}:
 *   put:
 *     summary: Update global settings for a group
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated global settings
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Unknown settings group
 */
router.put("/:group", authorize(UserRole.ADMIN), SettingController.updateGroup);

/**
 * @swagger
 * /api/settings/{group}/{key}:
 *   delete:
 *     summary: Delete a single settings key (falls back to default)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Key removed
 *       404:
 *         description: Group or key not found
 */
router.delete("/:group/:key", authorize(UserRole.ADMIN), SettingController.removeKey);

/**
 * @swagger
 * /api/settings/{group}:
 *   delete:
 *     summary: Reset a group to defaults
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group reset to defaults
 *       404:
 *         description: Unknown settings group
 */
router.delete("/:group", authorize(UserRole.ADMIN), SettingController.resetGroup);

export default router;