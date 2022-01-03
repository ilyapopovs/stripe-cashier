import { NextFunction, Request, Response } from "express";

/**
 * Prevent errors in promises from hanging the process
 */
export function runAsync(callback: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    callback(req, res, next).catch(next);
  };
}
