import { Router } from "express";
import { market } from "../../controller";
import { proposeValidator } from "../../middleware/proposeValidator";
import { tokenGateMiddleware } from "../../middleware/tokenGateMiddleware";

const router = Router();

router.post("/create", tokenGateMiddleware, proposeValidator, market.create_market);
router.post("/add", market.additionalInfo);
router.post("/addLiquidity", market.add_liquidity);
router.post("/betting", market.betting);
router.post("/liquidity", market.addLiquidity);
router.post("/resolve", market.adminResolve);
router.get("/get", market.getMarketData);

export default router;