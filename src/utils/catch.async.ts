import { NextFunction, Request, Response } from "express";

export const catchAsync =
  (fn: Callback) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

type Callback = (req: Request, res: Response, next: NextFunction) => void;
