/**
 * @swagger
 * components:
 *   schemas:
 *     IPagedDataReturn:
 *       required:
 *         - pageSize
 *         - pageNumber
 *         - results
 *       type: object
 *       description: Return object type from a GET call that uses paging.
 *       properties:
 *         links:
 *           type: object
 *           properties:
 *             base:
 *               type: string
 *               description: Link to retrieve the first page of items
 *             next:
 *               type: string
 *               description: Link to retrieve the next page of items
 *             prev:
 *               type: string
 *               description: Link to retrieve the previous page of items
 *         pageSize:
 *           type: number
 *           description: Maximmum number of returned items in this page
 *           example: 10
 *         pageNumber:
 *           type: number
 *           description: Page number of pageSize items
 *           example: 2
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *                templated:
 *                  type: object
 */
export interface IPagedDataReturn<T> {
    _links: {
        base: string;
        next?: string;
        prev?: string;
    };
    pageSize: number;
    pageNumber: number;
    results: T[];
}
