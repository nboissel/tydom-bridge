import { Request, Response } from "express";
import { getAllCoversInfo, getCoverInfo, closeCover } from './TydomController';

export default [
  {
    path: "/api/cover",
    method: "put",
    handler: async (req: Request, res: Response) => {
      const {id, position} = req.body;
      const result = await closeCover(id, position);
      res.status(200).send();
    }
  },
  {
    path: "/api/cover/:id",
    method: "get",
    handler: async (req: Request, res: Response) => {
      const result = await getCoverInfo(req.params.id);
      
      res.status(200).send(result);
    }
  },
  {
    path: "/api/covers",
    method: "get",
    handler: async (req: Request, res: Response) => {
      const result = await getAllCoversInfo(req.params.id);
      
      res.status(200).send(result);
    }
  }
];