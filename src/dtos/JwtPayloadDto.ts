/**
 * @swagger
 * components:
 *   schemas:
 *     JwtPayloadDto:
 *       required:
 *         - userId
 *         - operations
 *         - audit
 *         - iat
 *         - exp
 *       type: object
 *       description: JSON Web Token format.
 *       properties:
 *         userId:
 *           type: string
 *           example: 64adc0fe7a9c9d385950dfe2
 *           description: Unique user identifier
 *         operations:
 *           type: array
 *           description: List of operations that this user is allowed to perform. This will change as soon as RBAC is added.
 *           items:
 *             type: string
 *             example: ["UserUpsert", "UserDelete", "UserList", "ProdUpsert", "ProdDelete", "ProdList"]
 *         audit:
 *           type: boolean
 *           description: Boolean value that specifies whether this user's operations should be audited.
 *           example: false
 *         iat:
 *           type: number
 *           description: Claim Issued At (iat). This is the time at which the JWT was created, and can be used to determine the age of the JWT.
 *           example: 1445714161
 *         exp:
 *           type: number
 *           description: Claim Expiration (exp). Timestamp that indicates the expiration time of the JWT
 *           example: 1445714161
 */

export default interface JwtPayloadDto {
    userId: string;
    operations: string[];
    audit: boolean;
    iat: number;
    exp: number;
}
