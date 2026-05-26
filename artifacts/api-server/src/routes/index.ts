import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artistsRouter from "./artists";
import eventsRouter from "./events";
import contentRouter from "./content";
import formsRouter from "./forms";
import portalRouter from "./portal";
import bookingsRouter from "./bookings";
import integrationsRouter from "./integrations";
import authRouter from "./auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contentRouter);
router.use(integrationsRouter);
router.use(formsRouter);
router.use(authRouter);
router.use("/functions/v1", adminRouter);
router.use("/artists", artistsRouter);
router.use("/events", eventsRouter);
router.use("/artist-dates", portalRouter);
router.use("/booking-requests", bookingsRouter);

export default router;
