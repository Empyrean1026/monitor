import type { Request, Response } from 'express';
import { getProductCategories, getProducts, getSlowMovingProducts } from '../services/product.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type { ProductListQuery, SlowMovingProductsQuery } from '../validators/product.validator.js';
export async function productCategoriesController(_request: Request, response: Response): Promise<Response> { return sendSuccess(response, await getProductCategories()); }
export async function productListController(_request: Request, response: Response): Promise<Response> { return sendSuccess(response, await getProducts(response.locals.validatedInput as ProductListQuery)); }
export async function slowMovingProductsController(_request: Request, response: Response): Promise<Response> { return sendSuccess(response, await getSlowMovingProducts(response.locals.validatedInput as SlowMovingProductsQuery)); }
