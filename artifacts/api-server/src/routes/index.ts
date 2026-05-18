import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artistsRouter from "./artists";
import eventsRouter from "./events";
import contentRouter from "./content";
import formsRouter from "./forms";
import portalRouter from "./portal";
import bookingsRouter from "./bookings";
import integrationsRouter from "./integrations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contentRouter);
router.use(integrationsRouter);
router.use(formsRouter);
router.use("/artists", artistsRouter);
router.use("/events", eventsRouter);
router.use("/artist-dates", portalRouter);
router.use("/booking-requests", bookingsRouter);

export default router;
